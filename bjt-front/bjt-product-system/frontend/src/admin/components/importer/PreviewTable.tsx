import React from 'react';
import { Table, Tag, Button, Space, Alert } from 'antd';

export interface ValidationResult {
  valid: boolean;
  errors?: string[];
}

interface PreviewTableProps {
  rows: Record<string, any>[];
  validation: ValidationResult[];
  onBack: () => void;
  onNext: () => void;
}

const PreviewTable: React.FC<PreviewTableProps> = ({ rows, validation, onBack, onNext }) => {
  if (!rows.length) {
    return (
      <div style={{ textAlign: 'center', padding: 40 }}>
        <p>文件中不包含任何数据行，请返回并重新上传。</p>
        <Button onClick={onBack}>Back</Button>
      </div>
    );
  }

  const columns = Object.keys(rows[0]).map((k) => ({
    title: k,
    dataIndex: k,
    render: (val: any, _rec: any, idx: number) => {
      const vali = validation[idx];
      const hasFieldError = vali.errors?.some((err) => err.toLowerCase().includes(k.toLowerCase()));
      if (hasFieldError) {
        return <Tag color="red">{val}</Tag>;
      }
      return val;
    },
  }));

  const data = rows.map((r, idx) => ({ key: idx, ...r }));

  const hasErr = validation.some((v) => !v.valid);

  return (
    <>
      {hasErr && (
        <Alert type="error" showIcon message="存在必填字段缺失，请修正红色单元格后继续" style={{ marginBottom: 8 }} />
      )}
      <Table
        columns={columns}
        dataSource={data}
        size="small"
        pagination={{ pageSize: 10 }}
        scroll={{ x: 'max-content', y: 300 }}
      />
      <Space style={{ marginTop: 16 }}>
        <Button onClick={onBack}>Back</Button>
        <Button type="primary" onClick={onNext}>Next</Button>
      </Space>
    </>
  );
};

export default PreviewTable; 