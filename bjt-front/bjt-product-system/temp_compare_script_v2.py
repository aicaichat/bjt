import re
import os

def parse_table_fields(init_sql_content):
    table_fields = {}
    # Regex to find CREATE TABLE statements and capture table name and columns block
    table_pattern = re.compile(r'CREATE TABLE IF NOT EXISTS `(\w+)` \((.*?)\)\s*ENGINE', re.S | re.IGNORECASE)
    # Regex to find field names at the beginning of a line in the columns block
    field_pattern = re.compile(r'^`(\w+)`')

    for table_match in table_pattern.finditer(init_sql_content):
        table_name = table_match.group(1)
        fields_block = table_match.group(2)
        current_table_fields = []
        for line in fields_block.splitlines():
            stripped_line = line.strip()
            # Check if the line starts with a backtick (potential field definition)
            # and does not start with common key/constraint keywords
            if stripped_line.startswith('`') and \
               not stripped_line.lower().startswith('primary key') and \
               not stripped_line.lower().startswith('unique key') and \
               not stripped_line.lower().startswith('key ') and \
               not stripped_line.lower().startswith('constraint') and \
               not stripped_line.lower().startswith('foreign key'):
                field_match = field_pattern.match(stripped_line)
                if field_match:
                    current_table_fields.append(field_match.group(1))
        if current_table_fields: # Only add table if fields were actually parsed
            table_fields[table_name] = current_table_fields
    return table_fields

def parse_insert_fields(generated_sql_content):
    insert_fields = {}
    # Regex to find INSERT INTO statements and capture table name and columns list
    # Handles optional schema name like `schema`.`table`
    insert_pattern = re.compile(r'INSERT INTO `?(?:\w+\.)?`?(\w+)`? \((.*?)\)\s*VALUES', re.S | re.IGNORECASE)
    for insert_match in insert_pattern.finditer(generated_sql_content):
        table_name = insert_match.group(1)
        fields_str = insert_match.group(2)
        # Clean up field names: remove backticks and leading/trailing whitespace
        fields = [f.strip().replace('`', '') for f in fields_str.split(',')]
        # Store columns from the first INSERT statement found for each table (assuming consistency within the file)
        if table_name not in insert_fields:
            insert_fields[table_name] = fields
    return insert_fields

def compare_and_print_results(sql_file_basename, init_schemas, insert_schemas):
    comparison_output = []
    # Check tables defined in init.sql against the INSERT statements in the current file
    for table_name, expected_fields in init_schemas.items():
        if table_name not in insert_schemas: # No INSERT for this table in the current file
            # Optionally, could note this if verbose output is desired, but primary goal is to check existing INSERTs
            continue

        actual_fields = insert_schemas[table_name]

        if not expected_fields:
            comparison_output.append(f"[{sql_file_basename}][{table_name}] WARNING: No columns parsed from init.sql for this table (schema parsing issue).")
            continue
        if not actual_fields:
            comparison_output.append(f"[{sql_file_basename}][{table_name}] WARNING: No columns parsed from INSERT statement in this file (INSERT parsing issue).")
            continue

        # Filter out id, created_at, updated_at from expected_fields for comparison, as per user's preference
        filtered_expected_fields = [f for f in expected_fields if f not in ('id', 'created_at', 'updated_at')]

        if filtered_expected_fields == actual_fields:
            comparison_output.append(f"[{sql_file_basename}][{table_name}] OK: Fields and order match init.sql (excluding id, created_at, updated_at).")
        else:
            comparison_output.append(f"[{sql_file_basename}][{table_name}] MISMATCH DETECTED (checked against init.sql excluding id, created_at, updated_at):")
            comparison_output.append(f"  init.sql fields (Expected, filtered): {filtered_expected_fields} (Count: {len(filtered_expected_fields)})")
            comparison_output.append(f"  INSERT fields (Actual)            : {actual_fields} (Count: {len(actual_fields)})")

            missing_from_insert = [f for f in filtered_expected_fields if f not in actual_fields]
            if missing_from_insert:
                comparison_output.append(f"  Fields in init.sql (filtered) but MISSING from INSERT: {missing_from_insert}")

            extra_in_insert = [f for f in actual_fields if f not in filtered_expected_fields]
            if extra_in_insert:
                comparison_output.append(f"  Fields in INSERT but EXTRA (not in filtered init.sql): {extra_in_insert}")

            # Check order only if the set of fields is the same but the lists are not
            if set(filtered_expected_fields) == set(actual_fields) and filtered_expected_fields != actual_fields:
                comparison_output.append(f"  Order MISMATCH. Expected order (filtered): {filtered_expected_fields}")
            
            comparison_output.append(f"  Recommendation: Review Excel headers and order for table `{table_name}` or init.sql definition.")
        comparison_output.append("-" * 40)

    # Check for tables in INSERT statements that are not defined in init.sql
    for table_name, actual_fields in insert_schemas.items():
        if table_name not in init_schemas:
            comparison_output.append(f"[{sql_file_basename}][{table_name}] WARNING: Table found in INSERT statement but NOT DEFINED in init.sql.")
            comparison_output.append(f"  INSERT fields: {actual_fields}")
            comparison_output.append("-" * 40)
    
    return "\n".join(comparison_output)

# Main script execution
final_report = []
init_sql_file_path = 'docker/dev/mysql/init.sql'
init_table_definitions = {} # Initialize to prevent NameError if init.sql parsing fails

try:
    with open(init_sql_file_path, 'r', encoding='utf-8') as f:
        init_content = f.read()
    init_table_definitions = parse_table_fields(init_content)
    if not init_table_definitions:
        final_report.append(f"CRITICAL: Could not parse any table definitions from {init_sql_file_path}. Comparison cannot proceed.")
    else:
        final_report.append(f"Successfully parsed {len(init_table_definitions)} table definitions from {init_sql_file_path}.\n")
except FileNotFoundError:
    final_report.append(f"CRITICAL: init.sql file not found at {init_sql_file_path}. Comparison cannot proceed.")
except Exception as e:
    final_report.append(f"CRITICAL: Error reading or parsing {init_sql_file_path}: {str(e)}. Comparison cannot proceed.")

# Proceed only if init.sql was parsed successfully and definitions were found
if init_table_definitions:
    generated_sql_directory = 'generated_sql_imports'
    if not os.path.isdir(generated_sql_directory):
        final_report.append(f"INFO: Directory '{generated_sql_directory}' not found. No SQL files to check.")
    else:
        sql_files_in_dir = [f for f in os.listdir(generated_sql_directory) if f.endswith('.sql')]
        if not sql_files_in_dir:
            final_report.append(f"INFO: No .sql files found in '{generated_sql_directory}'.")
        else:
            final_report.append(f"Found {len(sql_files_in_dir)} .sql files in '{generated_sql_directory}' for checking.\n")
            for current_sql_filename in sql_files_in_dir:
                current_sql_file_path = os.path.join(generated_sql_directory, current_sql_filename)
                final_report.append(f"--- Checking File: {current_sql_filename} ---")
                try:
                    with open(current_sql_file_path, 'r', encoding='utf-8') as f:
                        generated_content = f.read()
                    
                    insert_statement_columns = parse_insert_fields(generated_content)
                    
                    if not insert_statement_columns:
                        final_report.append(f"  No INSERT statements found or parsed in {current_sql_filename}.\n")
                    else:
                        results_for_file = compare_and_print_results(current_sql_filename, init_table_definitions, insert_statement_columns)
                        final_report.append(results_for_file + "\n")
                except FileNotFoundError:
                    final_report.append(f"  ERROR: File {current_sql_filename} not found during detailed check (should not happen if listed prior).\n")
                except Exception as e:
                    final_report.append(f"  ERROR processing file {current_sql_filename}: {str(e)}\n")

print("\n".join(final_report)) 