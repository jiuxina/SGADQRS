import { useState, useEffect } from 'react'
import { motion } from 'motion/react'
import { Clock } from 'lucide-react'
import { staggerItem } from '../motion/variants'
import { statsApi } from '../api'
import { countdownText } from '../utils/date'
import { toast } from './toastUtils'
import type { UpcomingDeadline, UpcomingStart } from '../api/types'

export default function UpcomingReminders() {
  const [upcomingDeadlines, setUpcomingDeadlines] = useState<UpcomingDeadline[]>([])
  const [upcomingStarts, setUpcomingStarts] = useState<UpcomingStart[]>([])

  useEffect(() => {
    statsApi.upcoming().then((res) => {
      const data = res as { upcomingDeadlines: UpcomingDeadline[]; upcomingStarts: UpcomingStart[] }
      setUpcomingDeadlines(data.upcomingDeadlines)
      setUpcomingStarts(data.upcomingStarts)
    }).catch((e) => { toast.error('加载提醒数据失败'); console.error(e) })
  }, [])

  return (
    <motion.div className="bento-card bento-wide" variants={staggerItem} style={{ display: 'flex', flexDirection: 'column' }}>
      <div className="bento-label"><Clock size={18} strokeWidth={1.5} /> 时间节点提醒</div>
      <div style={{ marginTop: '10px', flex: 1, display: 'flex', flexDirection: 'column', gap: '8px', overflow: 'auto' }}>
        {upcomingDeadlines.length === 0 && upcomingStarts.length === 0 ? (
          <div className="bento-sub">暂无近期重要节点</div>
        ) : (
          <>
            {upcomingDeadlines.slice(0, 4).map((item) => (
              <div key={`dl-${item.id}-${item.deadlineType}`} className="bento-timeline-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <span style={{ fontSize: '13px', color: 'var(--text-primary)', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.competitionName}</span>
                  <span style={{ fontSize: '11px', color: 'var(--danger)' }}>{item.deadlineType} · {countdownText(item.deadlineTime)}</span>
                </div>
                <span style={{ fontSize: '11px', fontWeight: '600', color: 'var(--danger)', flexShrink: 0 }}>
                  {new Date(item.deadlineTime).toLocaleDateString('zh-CN')}
                </span>
              </div>
            ))}
            {upcomingStarts.slice(0, 3).map((item) => (
              <div key={`st-${item.id}`} className="bento-timeline-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <span style={{ fontSize: '13px', color: 'var(--text-primary)', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.competitionName}</span>
                  <span style={{ fontSize: '11px', color: 'var(--success)' }}>即将开始 · {countdownText(item.startTime)}</span>
                </div>
                <span style={{ fontSize: '11px', fontWeight: '600', color: 'var(--success)', flexShrink: 0 }}>
                  {new Date(item.startTime).toLocaleDateString('zh-CN')}
                </span>
              </div>
            ))}
          </>
        )}
      </div>
    </motion.div>
  )
}
