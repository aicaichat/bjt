import React, { useState, useEffect } from 'react';
import { decodeUtf8Unicode, safeTextContent, fixMojibake } from '../utils/string';
import axios from 'axios';

/**
 * ChineseTextDebug component - helps diagnose and fix Chinese character encoding issues
 * This is a development-only component that shows original vs. decoded text
 */
const ChineseTextDebug: React.FC = () => {
  const [apiData, setApiData] = useState<any>(null);
  const [rawResponse, setRawResponse] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        // Use Axios interceptor to get the raw response before any processing
        const response = await axios.get('/wp-json/bjt/v1/product-lines');
        
        setApiData(response.data);
        setRawResponse(JSON.stringify(response.data, null, 2));
        
        console.log('Original API response:', response.data);
        console.log('Response headers:', response.headers);
        console.log('Content-Type:', response.headers['content-type']);
        console.log('Decoded response:', decodeUtf8Unicode(response.data));
        
        // Log the raw Chinese texts as they appear
        if (response.data && response.data.data && response.data.data.length > 0) {
          const firstItem = response.data.data[0];
          console.log('Raw title_zh:', firstItem.title_zh);
          console.log('Raw title_zh (as JSON):', JSON.stringify(firstItem.title_zh));
          
          // Test how JSON.parse handles Unicode escapes
          try {
            const unicodeTest = `"\\u00e6\\u00b0\\u201d\\u00e5\\u017e\\u00ab\\u00e6\\u0153\\u00ba"`;
            console.log('Unicode test string:', unicodeTest);
            console.log('Parsed Unicode:', JSON.parse(unicodeTest));
          } catch (e) {
            console.error('Unicode parse error:', e);
          }
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  if (isLoading) {
    return <div>Loading data...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (!apiData) {
    return <div>No data available</div>;
  }

  // Test cases with different Unicode formats
  const unicodeEscapes = [
    { raw: "\\\\u00e6\\\\u00b0\\\\u201d", description: "Unicode escapes with double backslashes" },
    { raw: "\u00e6\u00b0\u201d", description: "Unicode escapes with single backslash" },
    { raw: "æ°", description: "Rendered characters" },
    { raw: "气", description: "Direct Chinese character" }
  ];

  return (
    <div style={{ 
      padding: '20px', 
      maxWidth: '1200px', 
      margin: '0 auto',
      fontFamily: 'monospace',
      backgroundColor: '#f9f9f9',
      border: '1px solid #ddd',
      borderRadius: '8px',
      overflow: 'auto'
    }}>
      <h2>Chinese Text Encoding Debug</h2>
      <p>This component helps diagnose Unicode escape sequence issues in API responses</p>
      
      <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#e9f7e9', borderRadius: '5px' }}>
        <h3>Unicode Escape Sequence Tests</h3>
        <div>
          {unicodeEscapes.map((test, index) => (
            <div key={index} style={{ marginBottom: '10px' }}>
              <p><strong>{test.description}:</strong> {test.raw}</p>
              <p><strong>JSON.stringify result:</strong> {JSON.stringify(test.raw)}</p>
              <p><strong>fixMojibake result:</strong> {fixMojibake(test.raw)}</p>
            </div>
          ))}
        </div>
      </div>
      
      <div style={{ marginBottom: '20px' }}>
        <h3>Raw API Response</h3>
        <div style={{ 
          backgroundColor: '#282c34', 
          color: '#abb2bf', 
          padding: '15px', 
          borderRadius: '5px',
          maxHeight: '300px',
          overflow: 'auto'
        }}>
          <pre>{rawResponse}</pre>
        </div>
      </div>
      
      <h3>API Data Sample</h3>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <div style={{ backgroundColor: '#fff', padding: '15px', borderRadius: '5px', border: '1px solid #eee' }}>
          <h4>Original Data (Direct from API)</h4>
          {apiData.data && apiData.data.map((item: any, index: number) => (
            <div key={index} style={{ marginBottom: '10px', padding: '10px', border: '1px solid #ddd' }}>
              <p><strong>ID:</strong> {item.id}</p>
              <p><strong>Title (ZH):</strong> {item.title_zh}</p>
              <p><strong>Raw JSON:</strong> {JSON.stringify(item.title_zh)}</p>
              <p><strong>Title (EN):</strong> {item.title_en}</p>
              <p><strong>Description (ZH):</strong> {item.description_zh}</p>
            </div>
          ))}
        </div>
        
        <div style={{ backgroundColor: '#fff', padding: '15px', borderRadius: '5px', border: '1px solid #eee' }}>
          <h4>Fixed Data (Using decodeUtf8Unicode)</h4>
          {apiData.data && apiData.data.map((item: any, index: number) => (
            <div key={index} style={{ marginBottom: '10px', padding: '10px', border: '1px solid #ddd' }}>
              <p><strong>ID:</strong> {item.id}</p>
              <p><strong>Title (ZH):</strong> {decodeUtf8Unicode(item.title_zh)}</p>
              <p><strong>After fixMojibake:</strong> {fixMojibake(item.title_zh)}</p>
              <p><strong>Using JSON.parse:</strong> {tryParseUnicode(item.title_zh)}</p>
              <p><strong>Title (EN):</strong> {item.title_en}</p>
              <p><strong>Description (ZH):</strong> {decodeUtf8Unicode(item.description_zh)}</p>
            </div>
          ))}
        </div>
      </div>
      
      {process.env.NODE_ENV === 'development' && (
        <div style={{ marginTop: '20px' }}>
          <h3>Developer Notes</h3>
          <ul style={{ lineHeight: '1.5' }}>
            <li>The server is correctly sending <code>Content-Type: application/json; charset=utf-8</code></li>
            <li>Unicode escape sequences in JSON (like <code>\u00e6\u00b0\u201d</code>) are valid and should be automatically decoded</li>
            <li>If you're seeing raw escape sequences, the issue is likely in how the JSON is being parsed or displayed</li>
            <li>The JS engine should automatically convert Unicode escape sequences when parsing JSON</li>
            <li>Check if any custom processing is interfering with the natural JSON parsing</li>
          </ul>
        </div>
      )}
    </div>
  );
};

// Helper function to try parsing Unicode escape sequences
function tryParseUnicode(text: string): string {
  try {
    // Attempt to parse as if it were a JSON string with Unicode escapes
    if (text.includes('\\u')) {
      return JSON.parse(`"${text.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`);
    }
    return text;
  } catch (e) {
    console.error('Unicode parsing error:', e);
    return `[Error parsing: ${text}]`;
  }
}

export default ChineseTextDebug; 