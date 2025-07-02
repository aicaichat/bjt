import React, { useState } from 'react';
import { Upload, Modal, Steps, message, Button } from 'antd';
import { UploadOutlined, DownloadOutlined } from '@ant-design/icons';
import type { RcFile } from 'antd/lib/upload/interface';
import { parseExcel } from './useExcelParser';
import FieldMapper, { Mapping } from './FieldMapper';
import PreviewTable, { ValidationResult } from './PreviewTable';
import { previewImport, commitImport, downloadImportCsv } from '../../../services/import/importApi';

// antd Upload component has static Dragger but TS definition lacks, cast any
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
const { Dragger } = Upload;

interface DataImporterProps {
  entity: string;
  requiredFields: string[];
  fieldAlias?: Record<string, string[]>;
  validateRow?: (row: Record<string, any>, index: number) => ValidationResult;
  mode?: 'insert' | 'update' | 'upsert';
  onSuccess?: () => void;
}

const steps = [
  { title: 'Upload' },
  { title: 'Map Fields' },
  { title: 'Preview' },
  { title: 'Commit' },
];

const DataImporter: React.FC<DataImporterProps> = ({
  entity,
  requiredFields,
  fieldAlias = {},
  validateRow,
  mode = 'upsert',
  onSuccess,
}) => {
  const [visible, setVisible] = useState(false);
  const [current, setCurrent] = useState(0);
  const [fileList, setFileList] = useState<RcFile[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<Record<string, any>[]>([]);
  const [mapping, setMapping] = useState<Mapping>({});
  const [validation, setValidation] = useState<ValidationResult[]>([]);

  /* ---------- step handlers ---------- */
  const handleUpload = async (file: RcFile) => {
    try {
      const buffer = await file.arrayBuffer();
      const { headers, rows } = await parseExcel(buffer);
      setHeaders(headers);
      setRows(rows);

      if (rows.length === 0) {
        message.error('文件中不包含任何数据行，请填写后再上传');
        return false;
      }

      message.success(`${file.name} parsed (${rows.length} rows)`);

      // attempt auto mapping
      const autoMap: Mapping = {};
      headers.forEach((h) => {
        // 1) required field exact match (case-insensitive)
        const req = requiredFields.find((f) => f.toLowerCase() === h.toLowerCase());
        if (req) {
          autoMap[h] = req;
          return;
        }

        // 2) alias lookup
        const aliasKey = Object.keys(fieldAlias).find((key) => fieldAlias[key].includes(h));
        if (aliasKey) {
          autoMap[h] = aliasKey;
          return;
        }

        // 3) 默认按原列名直传，保持可选字段（description/status 等）
        autoMap[h] = h;
      });

      const mappedTargets = Object.values(autoMap);
      const missing = requiredFields.filter((f) => !mappedTargets.includes(f));

      // 如果所有 header 都无法识别必填字段，则提示用户
      const mappedTargetsAll = Object.values(autoMap);
      const recognized = requiredFields.some((f) => mappedTargetsAll.includes(f));
      if (!recognized) {
        message.error('未识别任何有效表头，请确认使用系统导出的模板');
        return false;
      }

      if (missing.length === 0) {
        // all required mapped, skip UI
        handleMappingConfirm(autoMap);
      } else {
        setMapping(autoMap);
        setCurrent(1);
      }
      return false; // prevent auto upload to server
    } catch (err) {
      console.error(err);
      message.error('Failed to parse file');
      return false;
    }
  };

  const handleMappingConfirm = (map: Mapping) => {
    setMapping(map);
    // produce mapped rows
    const mappedRows = rows.map((r) => {
      const obj: Record<string, any> = {};
      Object.entries(map).forEach(([header, field]) => {
        if (field) obj[field] = r[header];
      });
      return obj;
    });
    // validate rows
    const rowValidator = validateRow ?? ((row: Record<string, any>) => {
      const errs: string[] = [];
      requiredFields.forEach((f) => {
        if (!row[f]) errs.push(`${f} required`);
      });
      return { valid: errs.length === 0, errors: errs } as ValidationResult;
    });
    const vali = mappedRows.map((row, idx) => rowValidator(row, idx));
    setValidation(vali);
    setRows(mappedRows);
    setCurrent(2);
  };

  const hasError = validation.some((v) => !v.valid);

  const handleCommit = async () => {
    if (hasError) {
      message.error('Please fix errors before commit');
      return;
    }
    try {
      message.loading('Previewing...');
      const preview = await previewImport(entity, mode, rows);
      if (!preview.valid) {
        message.error('Server validation failed');
        console.error(preview.errors);
        return;
      }
      message.loading('Committing...');
      await commitImport(preview.token!);
      message.success('Import success');
      setVisible(false);
      onSuccess?.();
    } catch (err) {
      console.error(err);
      message.error('Import failed');
    }
  };

  return (
    <>
      <Button icon={<UploadOutlined />} onClick={() => setVisible(true)}>
        Import
      </Button>
      <Modal
        title="Data Import Wizard"
        open={visible}
        destroyOnHidden
        onCancel={() => setVisible(false)}
        footer={null}
        width={900}
      >
        <Steps current={current} items={steps} style={{ marginBottom: 24 }} />

        {/* Step 0: Upload */}
        {current === 0 && (
          <>
            <div style={{ marginBottom: 16 }}>
              <Button icon={<DownloadOutlined />} onClick={() => downloadImportCsv(entity, 'template')}>下载模板</Button>
              <Button icon={<DownloadOutlined />} style={{ marginLeft: 8 }} onClick={() => downloadImportCsv(entity, 'data')}>导出数据</Button>
            </div>
            <Dragger
              multiple={false}
              fileList={fileList}
              onRemove={() => setFileList([])}
              beforeUpload={async (file) => {
                await handleUpload(file as RcFile);
                setFileList([file as RcFile]);
                return false; // prevent auto upload
              }}
              accept=".csv,.xlsx,.xls"
              style={{ padding: 32 }}
            >
              <p className="ant-upload-drag-icon">
                <UploadOutlined />
              </p>
              <p className="ant-upload-text">Drag or click to upload .xlsx / .csv</p>
            </Dragger>
          </>
        )}

        {/* Step 1: Field mapping */}
        {current === 1 && (
          <FieldMapper
            headers={headers}
            requiredFields={['model', 'title_zh', 'title_en']}
            alias={fieldAlias}
            onConfirm={handleMappingConfirm}
            onBack={() => setCurrent(0)}
          />
        )}

        {/* Step 2: Preview */}
        {current === 2 && (
          <PreviewTable
            rows={rows}
            validation={validation}
            onBack={() => setCurrent(1)}
            onNext={() => setCurrent(3)}
          />
        )}

        {/* Step 3: Commit */}
        {current === 3 && (
          <div style={{ textAlign: 'center' }}>
            <p>Ready to import {rows.length} rows.</p>
            <Button onClick={() => setCurrent(2)} style={{ marginRight: 8 }}>
              Back
            </Button>
            <Button type="primary" onClick={handleCommit} disabled={hasError}>
              Commit
            </Button>
          </div>
        )}
      </Modal>
    </>
  );
};

export default DataImporter; 