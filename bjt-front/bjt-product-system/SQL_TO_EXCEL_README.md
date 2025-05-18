# SQL to Excel Template Generator

This tool converts SQL INSERT statements into Excel templates for data entry and re-import.

## Features

- Parses SQL INSERT statements from multiple files
- Generates Excel templates with proper formatting
- Creates empty rows for data entry
- Includes example data from the original SQL
- Generates an import script to read the Excel and generate SQL

## Requirements

- Python 3.6+
- Required packages:
  - pandas
  - openpyxl
  - pymysql (for import script)

## Installation

1. Clone this repository or download the source files
2. Create a virtual environment and install required packages:

```bash
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install pandas openpyxl pymysql
```

## Usage

### Basic Usage

Run the converter script:

```bash
python run_converter.py
```

This will:
1. Parse the SQL files in the `docker/dev/mysql` directory
2. Generate an Excel template file named `database_import_template.xlsx`
3. Create an import script named `import_excel.py`

### Custom SQL Files

To parse specific SQL files, modify `run_converter.py` and update the file paths:

```python
converter.parse_sql_files([
    "path/to/your/file1.sql",
    "path/to/your/file2.sql"
])
```

### Using the Excel Template

1. Open the generated Excel template
2. Each sheet represents a database table
3. Enter your data in rows 2-6 (the empty rows)
4. Save the Excel file

### Importing Data Back to Database

1. Configure the database connection in `import_excel.py`:

```python
db_config = {
    'host': 'your_host',
    'user': 'your_user',
    'password': 'your_password',
    'database': 'your_database'
}
```

2. Run the import script:

```bash
python import_excel.py database_import_template.xlsx
```

## Special Values

- **NULL values**: Leave the cell empty or type "NULL"
- **Current timestamp**: Type "NOW()" (without quotes)
- **Strings**: Enter as is, no need for quotes

## Troubleshooting

- If you encounter encoding issues, try opening the SQL file in a text editor and saving it with UTF-8 encoding
- Check the warnings and errors in the console output for parsing issues
- For import errors, check the database connection settings and table structure

## License

MIT 