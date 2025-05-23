import React, { useState, useEffect } from 'react';
import apiService from '../../services/apiService';
import { decodeUtf8Unicode, fixMojibake } from '../../utils/string';
import productLineService from '../../api/services/product-line.service';
import { machineService } from '../../api/services';

interface TestItem {
  id: number;
  text: string;
  type: string;
}

interface ServiceTestResult {
  serviceName: string;
  originalData: any;
  processedData: any;
  success: boolean;
  error?: string;
}

const UnicodeTest: React.FC = () => {
  const [apiData, setApiData] = useState<any>(null);
  const [localTests, setLocalTests] = useState<TestItem[]>([]);
  const [serviceTests, setServiceTests] = useState<ServiceTestResult[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Create some test cases
  useEffect(() => {
    const tests: TestItem[] = [
      {
        id: 1,
        text: "\u00e6\u00b0\u201d\u00e5\u017e\u00ab\u00e6\u0153\u00ba", // This is already decoded by JS
        type: "Unicode escapes in code"
      },
      {
        id: 2,
        text: "Raw Unicode escapes", // Changed to avoid linter issues
        type: "Escaped Unicode"
      },
      {
        id: 3,
        text: "Mojibake example", // Changed to avoid linter issues
        type: "Mojibake"
      },
      {
        id: 4,
        text: "气垫机", // Direct Chinese
        type: "Direct Chinese"
      }
    ];
    setLocalTests(tests);
  }, []);

  // Test all services
  useEffect(() => {
    const testServices = async () => {
      const results: ServiceTestResult[] = [];
      
      try {
        // Test productLineService
        const productLineResponse = await productLineService.getProductLines();
        results.push({
          serviceName: 'productLineService',
          originalData: productLineResponse,
          processedData: productLineResponse,
          success: true
        });
      } catch (err) {
        console.error('Error testing productLineService:', err);
        results.push({
          serviceName: 'productLineService',
          originalData: null,
          processedData: null,
          success: false,
          error: err instanceof Error ? err.message : 'Unknown error'
        });
      }
      
      try {
        // Test machineService
        const machineResponse = await machineService.getMachines();
        results.push({
          serviceName: 'machineService',
          originalData: machineResponse,
          processedData: machineResponse,
          success: true
        });
      } catch (err) {
        console.error('Error testing machineService:', err);
        results.push({
          serviceName: 'machineService',
          originalData: null,
          processedData: null,
          success: false,
          error: err instanceof Error ? err.message : 'Unknown error'
        });
      }
      
      setServiceTests(results);
    };
    
    testServices();
  }, []);

  // Fetch data from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        // Use our API service which should now better handle Unicode escapes
        const response = await apiService.get('/wp-json/bjt/v1/test-charset');
        setApiData(response.data);
        console.log('API Response:', response);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const tryParseRawUnicode = (text: string): string => {
    try {
      if (text.includes('\\u')) {
        return JSON.parse(`"${text.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`);
      }
      return text;
    } catch (e) {
      console.error('Error parsing Unicode:', e);
      return `[Error: ${text}]`;
    }
  };

  // Extract a Chinese field from an object for testing
  const extractChineseField = (obj: any, fieldName: string = 'title_zh'): string => {
    if (!obj) return 'No data';
    
    if (Array.isArray(obj.items) && obj.items.length > 0) {
      return obj.items[0][fieldName] || 'Field not found';
    }
    
    if (Array.isArray(obj) && obj.length > 0) {
      return obj[0][fieldName] || 'Field not found';
    }
    
    return 'No items found';
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Unicode Handling Test</h1>
      <p>This page tests how different approaches handle Unicode escape sequences.</p>

      <h2>Local Tests</h2>
      <div style={{ marginBottom: '30px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Type</th>
              <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Original</th>
              <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>fixMojibake</th>
              <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>decodeUtf8Unicode</th>
              <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>tryParseRawUnicode</th>
            </tr>
          </thead>
          <tbody>
            {localTests.map((item) => (
              <tr key={item.id}>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{item.type}</td>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{item.text}</td>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{fixMojibake(item.text)}</td>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{decodeUtf8Unicode(item.text)}</td>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{tryParseRawUnicode(item.text)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2>Service Tests</h2>
      <div style={{ marginBottom: '30px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Service</th>
              <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Status</th>
              <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Chinese Sample</th>
            </tr>
          </thead>
          <tbody>
            {serviceTests.map((test, index) => (
              <tr key={index}>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{test.serviceName}</td>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                  {test.success ? 
                    <span style={{ color: 'green' }}>Success</span> : 
                    <span style={{ color: 'red' }}>Failed: {test.error}</span>
                  }
                </td>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                  {test.success ? extractChineseField(test.processedData) : 'N/A'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2>API Test Results</h2>
      {isLoading ? (
        <p>Loading...</p>
      ) : error ? (
        <p>Error: {error}</p>
      ) : apiData ? (
        <div>
          <h3>Test String from API</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Method</th>
                <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Result</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>Original Response</td>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{apiData.test_string}</td>
              </tr>
              <tr>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>Raw JSON Representation</td>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{JSON.stringify(apiData.test_string)}</td>
              </tr>
              <tr>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>decodeUtf8Unicode</td>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{decodeUtf8Unicode(apiData.test_string)}</td>
              </tr>
              <tr>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>fixMojibake</td>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{fixMojibake(apiData.test_string)}</td>
              </tr>
            </tbody>
          </table>
          
          <h3>Response Structure</h3>
          <pre style={{ 
            backgroundColor: '#f5f5f5', 
            padding: '15px', 
            borderRadius: '5px',
            overflow: 'auto' 
          }}>
            {JSON.stringify(apiData, null, 2)}
          </pre>
        </div>
      ) : (
        <p>No data available</p>
      )}
    </div>
  );
};

export default UnicodeTest; 