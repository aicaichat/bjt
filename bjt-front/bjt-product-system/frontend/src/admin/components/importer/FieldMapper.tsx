import React, { useState } from 'react';
import { Table, Select, Button, Space, message } from 'antd';

export interface Mapping {
  [header: string]: string; // csv header -> target field
}

interface FieldMapperProps {
  headers: string[];
  requiredFields: string[];
  alias?: Record<string, string[]>;
  onConfirm: (mapping: Mapping) => void;
  onBack: () => void;
}

const FieldMapper: React.FC<FieldMapperProps> = ({ headers, requiredFields, alias = {}, onConfirm, onBack }) => {
  const allTargetFields = Array.from(new Set([...requiredFields, ...Object.keys(alias)]));
  const [map, setMap] = useState<Mapping>(() => {
    const init: Mapping = {};
    headers.forEach((h) => {
      // auto match by alias or same
      const found = allTargetFields.find((f) => f.toLowerCase() === h.toLowerCase() || (alias[f]?.includes(h) ?? false));
      if (found) init[h] = found;
    });
    return init;
  });

  const columns = [
    { title: 'CSV Header', dataIndex: 'header', key: 'header' },
    {
      title: 'Map To Field',
      key: 'field',
      render: (_: any, record: { header: string }) => (
        <Select
          style={{ width: 200 }}
          allowClear
          value={map[record.header]}
          onChange={(val) => setMap((prev) => ({ ...prev, [record.header]: val as string }))}
          options={allTargetFields.map((f) => ({ label: f, value: f }))}
        />
      ),
    },
  ];

  const dataSource = headers.map((h) => ({ key: h, header: h }));

  const handleNext = () => {
    // check required fields mapped
    const mappedTargets = Object.values(map);
    const missing = requiredFields.filter((f) => !mappedTargets.includes(f));
    if (missing.length) {
      message.error(`Missing mapping for fields: ${missing.join(', ')}`);
      return;
    }
    onConfirm(map);
  };

  return (
    <>
      <Table columns={columns} dataSource={dataSource} pagination={false} size="small" />
      <Space style={{ marginTop: 16 }}>
        <Button onClick={onBack}>Back</Button>
        <Button type="primary" onClick={handleNext}>Next</Button>
      </Space>
    </>
  );
};

export default FieldMapper; 