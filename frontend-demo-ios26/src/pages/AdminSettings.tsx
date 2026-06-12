import { useState } from 'react'
import { motion } from 'motion/react'
import { Pencil, Check, X, Server, Shield, Clock, Database } from 'lucide-react'
import { staggerContainer, staggerItem, fadeSlideUp } from '../motion/variants'
import { mockConfigs } from '../data/mockData'

export default function AdminSettings() {
  const [editStates, setEditStates] = useState<Record<string, boolean>>({})
  const [values, setValues] = useState<Record<string, string>>(
    Object.fromEntries(mockConfigs.map((c) => [c.id, c.value]))
  )

  const toggleEdit = (id: string) => {
    setEditStates((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const cancelEdit = (id: string) => {
    const original = mockConfigs.find((c) => c.id === id)
    if (original) {
      setValues((prev) => ({ ...prev, [id]: original.value }))
    }
    setEditStates((prev) => ({ ...prev, [id]: false }))
  }

  const handleChange = (id: string, newValue: string) => {
    setValues((prev) => ({ ...prev, [id]: newValue }))
  }

  const handleSave = (id: string) => {
    // In a real app, this would call an API
    setEditStates((prev) => ({ ...prev, [id]: false }))
  }

  const systemInfo = [
    { icon: Server, label: '系统名称', value: '学生竞赛信息管理系统' },
    { icon: Shield, label: '当前版本', value: 'v2.1.0' },
    { icon: Clock, label: '运行时间', value: '128天 14小时 32分钟' },
    { icon: Database, label: '数据库状态', value: 'MySQL 8.0 · 正常' },
  ]

  return (
    <>
      {/* System Info Section */}
      <motion.div
        className="glass-card glass-card-vertical glass-card-static"
        style={{ padding: '0', marginBottom: '24px' }}
        variants={fadeSlideUp}
        initial="hidden"
        animate="visible"
      >
        <div style={{ padding: '16px 18px 12px' }}>
          <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)' }}>系统信息</span>
        </div>
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0' }}
        >
          {systemInfo.map((item, i) => (
            <motion.div
              key={item.label}
              variants={staggerItem}
              style={{
                padding: '16px 18px',
                borderLeft: i > 0 ? '1px solid rgba(0,0,0,0.04)' : 'none',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <item.icon size={14} color="var(--gray-1)" strokeWidth={1.5} />
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{item.label}</span>
              </div>
              <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>{item.value}</div>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>

      {/* System Configuration Section */}
      <motion.div
        className="glass-card glass-card-vertical glass-card-static"
        style={{ padding: '0' }}
        variants={fadeSlideUp}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.1 }}
      >
        <div style={{ padding: '16px 18px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)' }}>
            系统配置
            <span style={{ fontSize: '12px', fontWeight: '400', color: 'var(--text-tertiary)', marginLeft: '8px' }}>
              {mockConfigs.length}项
            </span>
          </span>
        </div>

        <motion.div variants={staggerContainer} initial="hidden" animate="visible">
          <motion.div variants={staggerItem}>
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: '220px' }}>配置键</th>
                  <th>配置值</th>
                  <th>描述</th>
                  <th style={{ width: '120px' }}>操作</th>
                </tr>
              </thead>
              <tbody>
                {mockConfigs.map((config) => {
                  const isEditing = editStates[config.id] ?? false
                  const currentValue = values[config.id] ?? config.value
                  const hasChanged = currentValue !== config.value

                  return (
                    <tr key={config.id}>
                      <td style={{ fontFamily: 'monospace', fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '500' }}>
                        {config.key}
                      </td>
                      <td>
                        {isEditing ? (
                          <input
                            className="glass-input"
                            value={currentValue}
                            onChange={(e) => handleChange(config.id, e.target.value)}
                            style={{
                              width: '100%',
                              boxSizing: 'border-box',
                              fontSize: '13px',
                              padding: '6px 10px',
                            }}
                            autoFocus
                          />
                        ) : (
                          <span style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: '500' }}>
                            {currentValue}
                          </span>
                        )}
                      </td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>{config.description}</td>
                      <td>
                        {isEditing ? (
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button
                              className="btn primary"
                              style={{
                                padding: '4px 10px',
                                fontSize: '12px',
                                gap: '4px',
                                opacity: hasChanged ? 1 : 0.5,
                              }}
                              onClick={() => handleSave(config.id)}
                            >
                              <Check size={12} strokeWidth={2} /> 保存
                            </button>
                            <button
                              className="btn ghost"
                              style={{ padding: '4px 10px', fontSize: '12px', gap: '4px' }}
                              onClick={() => cancelEdit(config.id)}
                            >
                              <X size={12} strokeWidth={2} /> 取消
                            </button>
                          </div>
                        ) : (
                          <button
                            className="text-btn blue"
                            style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}
                            onClick={() => toggleEdit(config.id)}
                          >
                            <Pencil size={11} strokeWidth={1.5} /> 编辑
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Footer info */}
      <motion.div
        style={{ marginTop: '24px', textAlign: 'center' }}
        variants={fadeSlideUp}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.2 }}
      >
        <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
          学生竞赛信息管理系统 v2.1.0 · 配置修改后立即生效
        </span>
      </motion.div>

      <div style={{ paddingBottom: '40px' }} />
    </>
  )
}
