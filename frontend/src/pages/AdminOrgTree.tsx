import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { ChevronRight, Building2, BookOpen, Users } from 'lucide-react'
import { staggerContainer, staggerItem, fadeSlideUp } from '../motion/variants'
import { deptApi } from '../api'
import type { DeptItem, MajorItem, ClassItem } from '../api/types'

interface DeptNode extends DeptItem {
  children: DeptNode[]
}

interface ExpandedState {
  [deptId: number]: boolean
}

interface MajorExpandedState {
  [majorId: number]: boolean
}

interface MajorCache {
  [deptId: number]: MajorItem[]
}

interface ClassCache {
  [majorId: number]: ClassItem[]
}

export default function AdminOrgTree() {
  const [departments, setDepartments] = useState<DeptItem[]>([])
  const [deptTree, setDeptTree] = useState<DeptNode[]>([])
  const [expandedDepts, setExpandedDepts] = useState<ExpandedState>({})
  const [expandedMajors, setExpandedMajors] = useState<MajorExpandedState>({})
  const [majorCache, setMajorCache] = useState<MajorCache>({})
  const [classCache, setClassCache] = useState<ClassCache>({})
  const [loading, setLoading] = useState(true)

  // Build tree from flat dept list using parentId
  const buildDeptTree = useCallback((depts: DeptItem[]): DeptNode[] => {
    const map = new Map<number, DeptNode>()
    const roots: DeptNode[] = []

    // Initialize all nodes
    depts.forEach((dept) => {
      map.set(dept.id, { ...dept, children: [] })
    })

    // Build parent-child relationships
    depts.forEach((dept) => {
      const node = map.get(dept.id)!
      if (dept.parentId === 0 || !map.has(dept.parentId)) {
        roots.push(node)
      } else {
        map.get(dept.parentId)!.children.push(node)
      }
    })

    return roots
  }, [])

  // Load departments on mount
  useEffect(() => {
    deptApi
      .list()
      .then((data) => {
        setDepartments(data)
        setDeptTree(buildDeptTree(data))
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [buildDeptTree])

  // Toggle department expand/collapse
  const toggleDept = async (deptId: number) => {
    const isExpanded = expandedDepts[deptId]
    setExpandedDepts((prev) => ({ ...prev, [deptId]: !isExpanded }))

    // Load majors on first expand
    if (!isExpanded && !majorCache[deptId]) {
      try {
        const majors = await deptApi.majors(deptId)
        setMajorCache((prev) => ({ ...prev, [deptId]: majors }))
      } catch (err) {
        console.error('Failed to load majors:', err)
      }
    }
  }

  // Toggle major expand/collapse
  const toggleMajor = async (majorId: number) => {
    const isExpanded = expandedMajors[majorId]
    setExpandedMajors((prev) => ({ ...prev, [majorId]: !isExpanded }))

    // Load classes on first expand
    if (!isExpanded && !classCache[majorId]) {
      try {
        const classes = await deptApi.classes(majorId)
        setClassCache((prev) => ({ ...prev, [majorId]: classes }))
      } catch (err) {
        console.error('Failed to load classes:', err)
      }
    }
  }

  if (loading) {
    return (
      <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-tertiary)' }}>
        加载中...
      </div>
    )
  }

  return (
    <>
      <motion.div style={{ marginBottom: '20px' }} variants={fadeSlideUp} initial="hidden" animate="visible">
        <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
          共 {departments.length} 个部门节点
        </span>
      </motion.div>

      <motion.div
        className="glass-card glass-card-vertical glass-card-static"
        style={{ padding: '0', maxWidth: '800px' }}
        variants={fadeSlideUp}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={staggerContainer} initial="hidden" animate="visible">
          {deptTree.map((dept) => (
            <motion.div key={dept.id} variants={staggerItem}>
              {/* Department Node */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '14px 16px',
                  borderBottom: '1px solid rgba(0,0,0,0.04)',
                  cursor: 'pointer',
                  userSelect: 'none',
                }}
                onClick={() => toggleDept(dept.id)}
              >
                <motion.div
                  animate={{ rotate: expandedDepts[dept.id] ? 90 : 0 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 20 }}
                >
                  <ChevronRight size={16} strokeWidth={1.5} color="var(--text-secondary)" />
                </motion.div>

                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: '10px',
                    background: 'rgba(0,122,255,0.06)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Building2 size={16} strokeWidth={1.5} color="var(--accent)" />
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: '14px',
                      fontWeight: '600',
                      color: 'var(--text-primary)',
                      marginBottom: '2px',
                    }}
                  >
                    {dept.deptName}
                  </div>
                  {dept.deptCode && (
                    <span className="glass-badge" style={{ fontSize: '11px' }}>
                      {dept.deptCode}
                    </span>
                  )}
                </div>

                <span className="text-btn" style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
                  {expandedDepts[dept.id] ? '收起' : '展开'}
                </span>
              </div>

              {/* Majors (Level 2) */}
              <AnimatePresence initial={false}>
                {expandedDepts[dept.id] && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 28 }}
                    style={{ overflow: 'hidden' }}
                  >
                    {majorCache[dept.id] ? (
                      majorCache[dept.id].length > 0 ? (
                        majorCache[dept.id].map((major) => (
                          <div key={major.id}>
                            {/* Major Node */}
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                padding: '12px 16px 12px 48px',
                                borderBottom: '1px solid rgba(0,0,0,0.03)',
                                cursor: 'pointer',
                                userSelect: 'none',
                              }}
                              onClick={() => toggleMajor(major.id)}
                            >
                              <motion.div
                                animate={{ rotate: expandedMajors[major.id] ? 90 : 0 }}
                                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  width: 20,
                                }}
                              >
                                <ChevronRight size={14} strokeWidth={1.5} color="var(--text-tertiary)" />
                              </motion.div>

                              <div
                                style={{
                                  width: 30,
                                  height: 30,
                                  borderRadius: '8px',
                                  background: 'rgba(52,199,89,0.06)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  flexShrink: 0,
                                }}
                              >
                                <BookOpen size={14} strokeWidth={1.5} color="#34C759" />
                              </div>

                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div
                                  style={{
                                    fontSize: '13px',
                                    fontWeight: '600',
                                    color: 'var(--text-primary)',
                                    marginBottom: '2px',
                                  }}
                                >
                                  {major.majorName}
                                </div>
                                {major.majorCode && (
                                  <span className="glass-badge" style={{ fontSize: '10px' }}>
                                    {major.majorCode}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Classes (Level 3) */}
                            <AnimatePresence initial={false}>
                              {expandedMajors[major.id] && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ type: 'spring', stiffness: 300, damping: 28 }}
                                  style={{ overflow: 'hidden' }}
                                >
                                  {classCache[major.id] ? (
                                    classCache[major.id].length > 0 ? (
                                      classCache[major.id].map((cls) => (
                                        <div
                                          key={cls.id}
                                          style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '12px',
                                            padding: '10px 16px 10px 80px',
                                            borderBottom: '1px solid rgba(0,0,0,0.02)',
                                          }}
                                        >
                                          <div
                                            style={{
                                              width: 26,
                                              height: 26,
                                              borderRadius: '7px',
                                              background: 'rgba(255,149,0,0.06)',
                                              display: 'flex',
                                              alignItems: 'center',
                                              justifyContent: 'center',
                                              flexShrink: 0,
                                            }}
                                          >
                                            <Users size={12} strokeWidth={1.5} color="#FF9500" />
                                          </div>

                                          <div style={{ flex: 1, minWidth: 0 }}>
                                            <span
                                              style={{
                                                fontSize: '13px',
                                                fontWeight: '500',
                                                color: 'var(--text-primary)',
                                              }}
                                            >
                                              {cls.className}
                                            </span>
                                            <span
                                              className="glass-badge"
                                              style={{ fontSize: '10px', marginLeft: '8px' }}
                                            >
                                              {cls.grade}级
                                            </span>
                                          </div>
                                        </div>
                                      ))
                                    ) : (
                                      <div
                                        style={{
                                          padding: '10px 16px 10px 80px',
                                          fontSize: '12px',
                                          color: 'var(--text-tertiary)',
                                        }}
                                      >
                                        暂无班级
                                      </div>
                                    )
                                  ) : (
                                    <div
                                      style={{
                                        padding: '10px 16px 10px 80px',
                                        fontSize: '12px',
                                        color: 'var(--text-tertiary)',
                                      }}
                                    >
                                      加载中...
                                    </div>
                                  )}
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        ))
                      ) : (
                        <div
                          style={{
                            padding: '12px 16px 12px 48px',
                            fontSize: '12px',
                            color: 'var(--text-tertiary)',
                          }}
                        >
                          暂无专业
                        </div>
                      )
                    ) : (
                      <div
                        style={{
                          padding: '12px 16px 12px 48px',
                          fontSize: '12px',
                          color: 'var(--text-tertiary)',
                        }}
                      >
                        加载中...
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>

      <div style={{ paddingBottom: '40px' }} />
    </>
  )
}
