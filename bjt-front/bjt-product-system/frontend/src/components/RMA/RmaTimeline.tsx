import React from 'react';
import { Card, Space, Tag } from 'antd';
import {
  ClockCircleOutlined,
  LoadingOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons';
import type { RMARequest, RMAComment } from '../../types/rma.types';

interface RmaTimelineProps {
  rma: RMARequest;
  comments?: RMAComment[];
}

const RmaTimeline: React.FC<RmaTimelineProps> = ({ rma, comments = [] }) => {
  // 生成时间线事件
  const generateTimelineEvents = () => {
    const events = [];

    // 添加创建事件
    events.push({
      id: 'created',
      type: 'created',
      title: '退货申请已创建',
      time: rma.created_at,
      description: `RMA编号：${rma.rma_number}，原因：${getReasonText(rma.reason_category)}`,
      icon: <ClockCircleOutlined style={{ color: '#1890ff' }} />,
    });

    // 添加状态变更事件
    const statusComments = comments.filter(comment => comment.comment_type === 'status_change');
    statusComments.forEach(comment => {
      events.push({
        id: `status_${comment.id}`,
        type: 'status_change',
        title: comment.content,
        time: comment.created_at,
        description: comment.user_name ? `操作人：${comment.user_name}` : '',
        icon: getStatusIcon(comment.content),
      });
    });

    // 添加普通评论
    const normalComments = comments.filter(comment => 
      comment.comment_type === 'comment' && !comment.is_internal
    );
    normalComments.forEach(comment => {
      events.push({
        id: `comment_${comment.id}`,
        type: 'comment',
        title: '新留言',
        time: comment.created_at,
        description: comment.content,
        user: comment.user_name,
        attachments: comment.attachments?.length || 0,
        icon: <ClockCircleOutlined style={{ color: '#8c8c8c' }} />,
      });
    });

    // 根据当前状态添加最终状态
    if (rma.status === 'completed') {
      events.push({
        id: 'completed',
        type: 'completed',
        title: '退货处理完成',
        time: rma.updated_at,
        description: `退款金额：¥${rma.total_refund_amount.toFixed(2)}`,
        icon: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
      });
    }

    // 按时间排序
    return events.sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());
  };

  // 获取状态图标
  const getStatusIcon = (statusText: string) => {
    if (statusText.includes('处理中') || statusText.includes('processing')) {
      return <LoadingOutlined style={{ color: '#1890ff' }} />;
    }
    if (statusText.includes('批准') || statusText.includes('approved')) {
      return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
    }
    if (statusText.includes('拒绝') || statusText.includes('rejected')) {
      return <CloseCircleOutlined style={{ color: '#ff4d4f' }} />;
    }
    if (statusText.includes('取消') || statusText.includes('cancelled')) {
      return <CloseCircleOutlined style={{ color: '#8c8c8c' }} />;
    }
    return <ClockCircleOutlined style={{ color: '#1890ff' }} />;
  };

  // 获取原因文本
  const getReasonText = (category: string) => {
    const reasonMap: Record<string, string> = {
      quality_issue: '质量问题',
      wrong_item: '发错商品',
      damaged_shipping: '运输损坏',
      not_as_described: '与描述不符',
      defective: '产品缺陷',
      customer_change: '客户改变主意',
      other: '其他原因',
    };
    return reasonMap[category] || category;
  };

  const events = generateTimelineEvents();

  return (
    <div className="rma-timeline" style={{ padding: '16px 0' }}>
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        {events.map((event, index) => (
          <Card 
            key={event.id} 
            size="small" 
            style={{ 
              borderLeft: `4px solid ${getEventColor(event.type)}`,
              marginLeft: '20px',
              position: 'relative'
            }}
          >
            <div style={{ 
              position: 'absolute', 
              left: '-30px', 
              top: '16px',
              background: '#fff',
              padding: '4px',
              borderRadius: '50%',
              border: '2px solid #f0f0f0'
            }}>
              {event.icon}
            </div>
            
            <div>
              <div style={{ 
                fontWeight: 600, 
                fontSize: '14px', 
                marginBottom: '4px',
                color: '#262626'
              }}>
                {event.title}
              </div>
              
              <div style={{ 
                fontSize: '12px', 
                color: '#8c8c8c', 
                marginBottom: '4px' 
              }}>
                {new Date(event.time).toLocaleString('zh-CN')}
              </div>
              
              {event.description && (
                <div style={{ 
                  fontSize: '13px', 
                  color: '#595959', 
                  marginBottom: '4px',
                  lineHeight: 1.4
                }}>
                  {event.description}
                </div>
              )}
              
              {event.user && (
                <div style={{ fontSize: '12px', color: '#8c8c8c' }}>
                  留言人：{event.user}
                </div>
              )}
              
              {event.attachments && event.attachments > 0 && (
                <Tag color="blue" size="small" style={{ marginTop: '4px' }}>
                  附件：{event.attachments} 个文件
                </Tag>
              )}
            </div>
          </Card>
        ))}
      </Space>
    </div>
  );
};

// 获取事件颜色
const getEventColor = (type: string) => {
  switch (type) {
    case 'created':
      return '#1890ff';
    case 'status_change':
      return '#52c41a';
    case 'comment':
      return '#8c8c8c';
    case 'completed':
      return '#52c41a';
    default:
      return '#d9d9d9';
  }
};

export default RmaTimeline; 