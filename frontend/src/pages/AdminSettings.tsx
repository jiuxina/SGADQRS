import { useState, useEffect } from 'react'
import { motion } from 'motion/react'
import { Pencil, Check, X, Server, Shield, Clock, Database } from 'lucide-react'
import ListMeta from '../components/ListMeta'
import { ListSkeleton } from '../components/PageSkeleton'
import { instant, fadeSlideUp } from '../motion/variants'
import { configApi } from '../api'
import type { ConfigItem } from '../api/types'
import { toast } from '../components/Toast'

export default function AdminSettings() {
  const [configs, setConfigs] = useState<ConfigItem[]>([])
  const [editStates, setEditStates] = useState<Record<number, boolean>>({})
  const [values, setValues] = useState<Record<number, string>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    configApi.list().then((data) => {
      setConfigs(data)
      setValues(Object.fromEntries(data.map((c) => [c.id, c.configValue])))
    }).catch(console.error).finally(() => setLoading(false))
  }, [])

  const toggleEdit = (id: number) => {
    setEditStates((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const cancelEdit = (id: number) => {
    const original = configs.find((c) => c.id === id)
    if (original) setValues((prev) => ({ ...prev, [id]: original.configValue }))
    setEditStates((prev) => ({ ...prev, [id]: false }))
  }

  const handleChange = (id: number, newValue: string) => {
    setValues((prev) => ({ ...prev, [id]: newValue }))
  }

  const saveEdit = async (id: number) => {
    try {
      await configApi.update(id, values[id] || '')
      setEditStates((prev) => ({ ...prev, [id]: false }))
      const updatedConfigs = await configApi.list()
      setConfigs(updatedConfigs)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '保存失败')
    }
  }

  const getIcon = (key: string) => {
    if (key.includes('password') || key.includes('audit')) return Shield
    if (key.includes('time') || key.includes('auto')) return Clock
    if (key.includes('database') || key.includes('max')) return Database
    return Server
  }

  if (loading) return <ListSkeleton />

  return (
    <>
      <motion.div style={{ marginBottom: '20px' }} variants={fadeSlideUp} initial="hidden" animate="visible">
        <ListMeta count={configs.length} unit="项" />
      </motion.div>

      <motion.div className="glass-card glass-card-vertical glass-card-static" style={{ padding: '0', maxWidth: '720px' }} variants={fadeSlideUp} initial="hidden" animate="visible">
        <motion.div variants={instant} initial="hidden" animate="visible">
          {configs.map((config) => {
            const isEditing = editStates[config.id]
            const IconComp = getIcon(config.configKey)
            return (
              <div
                key={config.id}
                className="setting-row"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 16px',
                  borderBottom: '1px solid rgba(0,0,0,0.04)',
                }}
              >
                <IconComp size={18} strokeWidth={1.5} color="var(--accent)" />

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '2px' }}>
                    {config.description || config.configKey}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontFamily: 'monospace' }}>
                    {config.configKey}
                  </div>
                </div>

                {isEditing ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      className="glass-input"
                      style={{ width: '180px', height: '32px', fontSize: '13px' }}
                      value={values[config.id] || ''}
                      onChange={(e) => handleChange(config.id, e.target.value)}
                    />
                    <button className="btn primary" style={{ padding: '4px 8px', fontSize: '12px', gap: '3px' }}
                      onClick={() => saveEdit(config.id)}>
                      <Check size={12} strokeWidth={2} />
                    </button>
                    <button className="btn ghost" style={{ padding: '4px 8px', fontSize: '12px', gap: '3px' }}
                      onClick={() => cancelEdit(config.id)}>
                      <X size={12} strokeWidth={2} />
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-primary)', fontFamily: 'monospace' }}>
                      {config.configValue}
                    </span>
                    <button className="text-btn blue" style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '3px' }}
                      onClick={() => toggleEdit(config.id)}>
                      <Pencil size={11} strokeWidth={1.5} /> 编辑
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </motion.div>
      </motion.div>

    </>
  )
}
