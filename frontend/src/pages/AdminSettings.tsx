import { motion } from 'motion/react'
import { Settings } from 'lucide-react'
import { fadeSlideUp } from '../motion/variants'

export default function AdminSettings() {
  return (
    <motion.div
      variants={fadeSlideUp}
      initial="hidden"
      animate="visible"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '80px 20px',
        textAlign: 'center',
      }}
    >
      <Settings size={48} strokeWidth={1.2} style={{ color: 'var(--text-tertiary)', marginBottom: '16px' }} />
      <div style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '8px' }}>
        系统设置
      </div>
      <div style={{ fontSize: '13px', color: 'var(--text-tertiary)', maxWidth: '400px', lineHeight: 1.6 }}>
        系统配置功能已移除。如需修改系统参数，请联系开发人员直接操作数据库。
      </div>
    </motion.div>
  )
}
