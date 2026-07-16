import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { ChevronRight, Building2, BookOpen, Users, Plus, Pencil, Trash2 } from 'lucide-react'
import ListMeta from '../components/ListMeta'
import GlassModal from '../components/GlassModal'
import { ListSkeleton } from '../components/PageSkeleton'
import { instant, fadeSlideUp } from '../motion/variants'
import { deptApi } from '../api'
import { toast } from '../components/toastUtils'
import { confirmDialog } from '../components/confirmDialogUtils'
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

type ModalType = 'dept' | 'major' | 'class' | null

interface ModalState {
  type: ModalType
  mode: 'create' | 'edit'
  /** For create: parentId (deptId for major, majorId for class) */
  parentId?: number
  /** For edit: the id of the item being edited */
  editId?: number
  /** Current field values */
  values: Record<string, string | number>
}

export default function AdminOrgTree() {
  const [departments, setDepartments] = useState<DeptItem[]>([])
  const [deptTree, setDeptTree] = useState<DeptNode[]>([])
  const [expandedDepts, setExpandedDepts] = useState<ExpandedState>({})
  const [expandedMajors, setExpandedMajors] = useState<MajorExpandedState>({})
  const [majorCache, setMajorCache] = useState<MajorCache>({})
  const [classCache, setClassCache] = useState<ClassCache>({})
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState<ModalState | null>(null)

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

  // Reload all data
  const reloadData = useCallback(async () => {
    try {
      const data = await deptApi.list()
      setDepartments(data)
      setDeptTree(buildDeptTree(data))
      // Clear caches so they reload on next expand
      setMajorCache({})
      setClassCache({})
    } catch (err) {
      console.error('Failed to reload:', err)
    }
  }, [buildDeptTree])

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

  // ===== Modal Handlers =====

  const openCreateModal = (type: ModalType, parentId: number) => {
    const defaultValues: Record<string, string | number> = {}
    if (type === 'dept') {
      defaultValues.deptName = ''
      defaultValues.deptCode = ''
      defaultValues.sortOrder = 0
    } else if (type === 'major') {
      defaultValues.majorName = ''
      defaultValues.majorCode = ''
    } else if (type === 'class') {
      defaultValues.className = ''
      defaultValues.grade = ''
    }
    setModal({ type, mode: 'create', parentId, values: defaultValues })
  }

  const openEditModal = (type: ModalType, item: DeptItem | MajorItem | ClassItem) => {
    const values: Record<string, string | number> = {}
    if (type === 'dept') {
      const d = item as DeptItem
      values.deptName = d.deptName
      values.deptCode = d.deptCode || ''
      values.sortOrder = (d as DeptItem & { sortOrder?: number }).sortOrder || 0
    } else if (type === 'major') {
      const m = item as MajorItem
      values.majorName = m.majorName
      values.majorCode = m.majorCode || ''
    } else if (type === 'class') {
      const c = item as ClassItem
      values.className = c.className
      values.grade = c.grade || ''
    }
    setModal({ type, mode: 'edit', editId: item.id, values })
  }

  const closeModal = () => setModal(null)

  const updateModalValue = (key: string, value: string | number) => {
    setModal((prev) => prev ? { ...prev, values: { ...prev.values, [key]: value } } : null)
  }

  const handleSave = async () => {
    if (!modal) return

    try {
      if (modal.type === 'dept') {
        const { deptName, deptCode, sortOrder } = modal.values
        if (!deptName || String(deptName).trim() === '') {
          toast.error('请输入院系名称')
          return
        }
        if (modal.mode === 'create') {
          await deptApi.create({ deptName: String(deptName), deptCode: String(deptCode || ''), sortOrder: Number(sortOrder) || 0 })
          toast.success('院系新增成功')
        } else {
          await deptApi.update(modal.editId!, { deptName: String(deptName), deptCode: String(deptCode || ''), sortOrder: Number(sortOrder) || 0 })
          toast.success('院系更新成功')
        }
      } else if (modal.type === 'major') {
        const { majorName, majorCode } = modal.values
        if (!majorName || String(majorName).trim() === '') {
          toast.error('请输入专业名称')
          return
        }
        if (modal.mode === 'create') {
          await deptApi.createMajor({ deptId: modal.parentId!, majorName: String(majorName), majorCode: String(majorCode || '') })
          toast.success('专业新增成功')
        } else {
          await deptApi.updateMajor(modal.editId!, { majorName: String(majorName), majorCode: String(majorCode || '') })
          toast.success('专业更新成功')
        }
      } else if (modal.type === 'class') {
        const { className, grade } = modal.values
        if (!className || String(className).trim() === '') {
          toast.error('请输入班级名称')
          return
        }
        if (modal.mode === 'create') {
          await deptApi.createClass({ majorId: modal.parentId!, className: String(className), grade: String(grade || '') })
          toast.success('班级新增成功')
        } else {
          await deptApi.updateClass(modal.editId!, { className: String(className), grade: String(grade || '') })
          toast.success('班级更新成功')
        }
      }

      closeModal()
      await reloadData()
    } catch (err) {
      toast.error('操作失败: ' + (err instanceof Error ? err.message : '未知错误'))
    }
  }

  const handleDelete = async (type: 'dept' | 'major' | 'class', id: number, name: string) => {
    const label = type === 'dept' ? '院系' : type === 'major' ? '专业' : '班级'
    const confirmed = await confirmDialog({
      title: `删除${label}`,
      message: `确定要删除${label}"${name}"吗？此操作不可恢复。`,
      confirmText: '删除',
      cancelText: '取消',
      variant: 'danger',
    })

    if (!confirmed) return

    try {
      if (type === 'dept') {
        await deptApi.delete(id)
      } else if (type === 'major') {
        await deptApi.deleteMajor(id)
      } else {
        await deptApi.deleteClass(id)
      }
      toast.success(`${label}删除成功`)
      await reloadData()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '删除失败')
    }
  }

  // ===== Modal Form Renderers =====

  const renderDeptForm = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div>
        <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>
          院系名称 <span style={{ color: '#FF3B30' }}>*</span>
        </label>
        <input
          type="text"
          value={modal?.values.deptName || ''}
          onChange={(e) => updateModalValue('deptName', e.target.value)}
          placeholder="请输入院系名称"
          style={{
            width: '100%', height: '40px', padding: '0 12px', borderRadius: '10px',
            border: '1px solid var(--border, rgba(0,0,0,0.1))', background: 'var(--glass-bg, rgba(0,0,0,0.03))',
            fontSize: '14px', color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box',
          }}
        />
      </div>
      <div>
        <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>
          院系编码
        </label>
        <input
          type="text"
          value={modal?.values.deptCode || ''}
          onChange={(e) => updateModalValue('deptCode', e.target.value)}
          placeholder="如: CS, EE"
          style={{
            width: '100%', height: '40px', padding: '0 12px', borderRadius: '10px',
            border: '1px solid var(--border, rgba(0,0,0,0.1))', background: 'var(--glass-bg, rgba(0,0,0,0.03))',
            fontSize: '14px', color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box',
          }}
        />
      </div>
      <div>
        <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>
          排序号
        </label>
        <input
          type="number"
          value={modal?.values.sortOrder ?? 0}
          onChange={(e) => updateModalValue('sortOrder', Number(e.target.value))}
          placeholder="0"
          style={{
            width: '100%', height: '40px', padding: '0 12px', borderRadius: '10px',
            border: '1px solid var(--border, rgba(0,0,0,0.1))', background: 'var(--glass-bg, rgba(0,0,0,0.03))',
            fontSize: '14px', color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box',
          }}
        />
      </div>
    </div>
  )

  const renderMajorForm = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div>
        <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>
          专业名称 <span style={{ color: '#FF3B30' }}>*</span>
        </label>
        <input
          type="text"
          value={modal?.values.majorName || ''}
          onChange={(e) => updateModalValue('majorName', e.target.value)}
          placeholder="请输入专业名称"
          style={{
            width: '100%', height: '40px', padding: '0 12px', borderRadius: '10px',
            border: '1px solid var(--border, rgba(0,0,0,0.1))', background: 'var(--glass-bg, rgba(0,0,0,0.03))',
            fontSize: '14px', color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box',
          }}
        />
      </div>
      <div>
        <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>
          专业编码
        </label>
        <input
          type="text"
          value={modal?.values.majorCode || ''}
          onChange={(e) => updateModalValue('majorCode', e.target.value)}
          placeholder="如: CS01, EE02"
          style={{
            width: '100%', height: '40px', padding: '0 12px', borderRadius: '10px',
            border: '1px solid var(--border, rgba(0,0,0,0.1))', background: 'var(--glass-bg, rgba(0,0,0,0.03))',
            fontSize: '14px', color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box',
          }}
        />
      </div>
    </div>
  )

  const renderClassForm = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div>
        <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>
          班级名称 <span style={{ color: '#FF3B30' }}>*</span>
        </label>
        <input
          type="text"
          value={modal?.values.className || ''}
          onChange={(e) => updateModalValue('className', e.target.value)}
          placeholder="请输入班级名称"
          style={{
            width: '100%', height: '40px', padding: '0 12px', borderRadius: '10px',
            border: '1px solid var(--border, rgba(0,0,0,0.1))', background: 'var(--glass-bg, rgba(0,0,0,0.03))',
            fontSize: '14px', color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box',
          }}
        />
      </div>
      <div>
        <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>
          年级
        </label>
        <input
          type="text"
          value={modal?.values.grade || ''}
          onChange={(e) => updateModalValue('grade', e.target.value)}
          placeholder="如: 2024"
          style={{
            width: '100%', height: '40px', padding: '0 12px', borderRadius: '10px',
            border: '1px solid var(--border, rgba(0,0,0,0.1))', background: 'var(--glass-bg, rgba(0,0,0,0.03))',
            fontSize: '14px', color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box',
          }}
        />
      </div>
    </div>
  )

  const getModalTitle = () => {
    if (!modal) return ''
    const label = modal.type === 'dept' ? '院系' : modal.type === 'major' ? '专业' : '班级'
    return modal.mode === 'create' ? `新增${label}` : `编辑${label}`
  }

  if (loading) {
    return <ListSkeleton />
  }

  return (
    <>
      <motion.div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }} variants={fadeSlideUp} initial="hidden" animate="visible">
        <ListMeta count={departments.length} unit="个" />
        <button
          onClick={() => openCreateModal('dept', 0)}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '8px 16px', borderRadius: '10px',
            background: 'var(--accent, #007AFF)', color: '#fff',
            border: 'none', fontSize: '13px', fontWeight: '600',
            cursor: 'pointer', fontFamily: 'inherit',
          }}
        >
          <Plus size={14} strokeWidth={2} />
          新增院系
        </button>
      </motion.div>

      <motion.div
        className="glass-card glass-card-vertical glass-card-static"
        style={{ padding: '0', maxWidth: '800px' }}
        variants={fadeSlideUp}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={instant} initial="hidden" animate="visible">
          {deptTree.map((dept) => (
            <div key={dept.id}>
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

                <Building2 size={18} strokeWidth={1.5} color="var(--accent)" />

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

                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <button
                    onClick={(e) => { e.stopPropagation(); openCreateModal('major', dept.id) }}
                    title="新增专业"
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      width: '28px', height: '28px', borderRadius: '8px',
                      background: 'transparent', border: 'none', cursor: 'pointer',
                      color: 'var(--text-tertiary)', transition: 'background 0.15s',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(0,0,0,0.05)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <Plus size={14} strokeWidth={2} />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); openEditModal('dept', dept) }}
                    title="编辑院系"
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      width: '28px', height: '28px', borderRadius: '8px',
                      background: 'transparent', border: 'none', cursor: 'pointer',
                      color: 'var(--text-tertiary)', transition: 'background 0.15s',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(0,0,0,0.05)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <Pencil size={14} strokeWidth={2} />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete('dept', dept.id, dept.deptName) }}
                    title="删除院系"
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      width: '28px', height: '28px', borderRadius: '8px',
                      background: 'transparent', border: 'none', cursor: 'pointer',
                      color: '#FF3B30', transition: 'background 0.15s',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,59,48,0.08)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <Trash2 size={14} strokeWidth={2} />
                  </button>
                  <span className="text-btn" style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginLeft: '4px' }}>
                    {expandedDepts[dept.id] ? '收起' : '展开'}
                  </span>
                </div>
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

                              <BookOpen size={16} strokeWidth={1.5} color="#34C759" />

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

                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <button
                                  onClick={(e) => { e.stopPropagation(); openCreateModal('class', major.id) }}
                                  title="新增班级"
                                  style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    width: '26px', height: '26px', borderRadius: '7px',
                                    background: 'transparent', border: 'none', cursor: 'pointer',
                                    color: 'var(--text-tertiary)', transition: 'background 0.15s',
                                  }}
                                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(0,0,0,0.05)')}
                                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                                >
                                  <Plus size={13} strokeWidth={2} />
                                </button>
                                <button
                                  onClick={(e) => { e.stopPropagation(); openEditModal('major', major) }}
                                  title="编辑专业"
                                  style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    width: '26px', height: '26px', borderRadius: '7px',
                                    background: 'transparent', border: 'none', cursor: 'pointer',
                                    color: 'var(--text-tertiary)', transition: 'background 0.15s',
                                  }}
                                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(0,0,0,0.05)')}
                                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                                >
                                  <Pencil size={13} strokeWidth={2} />
                                </button>
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleDelete('major', major.id, major.majorName) }}
                                  title="删除专业"
                                  style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    width: '26px', height: '26px', borderRadius: '7px',
                                    background: 'transparent', border: 'none', cursor: 'pointer',
                                    color: '#FF3B30', transition: 'background 0.15s',
                                  }}
                                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,59,48,0.08)')}
                                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                                >
                                  <Trash2 size={13} strokeWidth={2} />
                                </button>
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
                                          <Users size={14} strokeWidth={1.5} color="#FF9500" />

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

                                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <button
                                              onClick={(e) => { e.stopPropagation(); openEditModal('class', cls) }}
                                              title="编辑班级"
                                              style={{
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                width: '24px', height: '24px', borderRadius: '6px',
                                                background: 'transparent', border: 'none', cursor: 'pointer',
                                                color: 'var(--text-tertiary)', transition: 'background 0.15s',
                                              }}
                                              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(0,0,0,0.05)')}
                                              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                                            >
                                              <Pencil size={12} strokeWidth={2} />
                                            </button>
                                            <button
                                              onClick={(e) => { e.stopPropagation(); handleDelete('class', cls.id, cls.className) }}
                                              title="删除班级"
                                              style={{
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                width: '24px', height: '24px', borderRadius: '6px',
                                                background: 'transparent', border: 'none', cursor: 'pointer',
                                                color: '#FF3B30', transition: 'background 0.15s',
                                              }}
                                              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,59,48,0.08)')}
                                              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                                            >
                                              <Trash2 size={12} strokeWidth={2} />
                                            </button>
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
            </div>
          ))}
        </motion.div>
      </motion.div>

      {/* Edit/Create Modal */}
      <GlassModal
        open={modal !== null}
        onClose={closeModal}
        title={getModalTitle()}
        maxWidth="440px"
      >
        {modal?.type === 'dept' && renderDeptForm()}
        {modal?.type === 'major' && renderMajorForm()}
        {modal?.type === 'class' && renderClassForm()}

        <div style={{ display: 'flex', gap: '10px', marginTop: '24px' }}>
          <button
            onClick={closeModal}
            style={{
              flex: 1, height: '42px', borderRadius: '10px',
              background: 'var(--glass-bg, rgba(0,0,0,0.04))',
              border: '1px solid var(--border, rgba(0,0,0,0.08))',
              color: 'var(--text-secondary)',
              fontSize: '14px', fontWeight: '600',
              cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            取消
          </button>
          <button
            onClick={handleSave}
            style={{
              flex: 1, height: '42px', borderRadius: '10px',
              background: 'var(--accent, #007AFF)',
              border: 'none',
              color: '#fff',
              fontSize: '14px', fontWeight: '600',
              cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            {modal?.mode === 'create' ? '新增' : '保存'}
          </button>
        </div>
      </GlassModal>
    </>
  )
}
