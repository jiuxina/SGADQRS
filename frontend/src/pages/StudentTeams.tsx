import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import {
  Users,
  Plus,
  LogIn,
  Crown,
  Calendar,
  Hash,
  MessageSquareQuote,
} from 'lucide-react'
import ListMeta from '../components/ListMeta'
import EmptyState from '../components/EmptyState'
import { ListSkeleton } from '../components/PageSkeleton'
import { staggerContainer, staggerItem, fadeSlideUp } from '../motion/variants'
import GlassModal from '../components/GlassModal'
import { registrationApi } from '../api'
import { toast } from '../components/toastUtils'
import type { TeamItem } from '../api/types'
import { useIsMobile } from '../hooks/useIsMobile'
import { formatDate } from '../utils/format'
import { usePagination } from '../hooks/usePagination'
import Pagination from '../components/Pagination'

const teamStatusLabel: Record<number, string> = {
  0: '待审核',
  1: '已通过',
  2: '已拒绝',
}

const teamStatusClass: Record<number, string> = {
  0: 'reviewing',
  1: 'pass',
  2: 'pending',
}

const memberStatusLabel: Record<number, string> = {
  0: '待确认',
  1: '已确认',
  2: '已拒绝',
}

export default function StudentTeams() {
  const [teams, setTeams] = useState<TeamItem[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const pagination = usePagination()

  // 创建团队
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [createCompId, setCreateCompId] = useState('')
  const [teamName, setTeamName] = useState('')
  const [teamSlogan, setTeamSlogan] = useState('')
  const [creating, setCreating] = useState(false)

  // 加入团队
  const [showJoinModal, setShowJoinModal] = useState(false)
  const [joinTeamId, setJoinTeamId] = useState('')
  const [joining, setJoining] = useState(false)

  const isMobile = useIsMobile()

  const fetchData = useCallback(async () => {
    return registrationApi.teamList({ current: pagination.current, size: pagination.pageSize })
  }, [pagination.current, pagination.pageSize])

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const result = await fetchData()
      setTeams(result.records)
      setTotal(result.total)
      pagination.setTotal(result.total)
    } catch (err) {
      toast.error('加载团队数据失败')
      console.error('加载团队数据失败:', err)
    } finally {
      setLoading(false)
    }
  }, [fetchData])

  useEffect(() => {
    fetchData().then(result => {
      setTeams(result.records)
      setTotal(result.total)
      pagination.setTotal(result.total)
    }).catch(err => {
      toast.error('加载团队数据失败')
      console.error('加载团队数据失败:', err)
    }).finally(() => setLoading(false))
  }, [fetchData])

  const handleCreate = async () => {
    if (!createCompId.trim()) {
      toast.warning('请输入竞赛ID')
      return
    }
    if (!teamName.trim()) {
      toast.warning('请输入团队名称')
      return
    }
    setCreating(true)
    try {
      await registrationApi.createTeam({
        competitionId: Number(createCompId),
        teamName: teamName.trim(),
        teamSlogan: teamSlogan.trim() || undefined,
      })
      toast.success('团队创建成功')
      setShowCreateModal(false)
      setCreateCompId('')
      setTeamName('')
      setTeamSlogan('')
      loadData()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '创建失败')
    } finally {
      setCreating(false)
    }
  }

  const handleJoin = async () => {
    if (!joinTeamId.trim()) {
      toast.warning('请输入团队ID')
      return
    }
    setJoining(true)
    try {
      await registrationApi.joinTeam(Number(joinTeamId))
      toast.success('已成功加入团队')
      setShowJoinModal(false)
      setJoinTeamId('')
      loadData()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '加入失败')
    } finally {
      setJoining(false)
    }
  }

  if (loading && teams.length === 0) {
    return <ListSkeleton />
  }

  return (
    <>
      {/* Header actions */}
      <motion.div
        variants={fadeSlideUp}
        initial="hidden"
        animate="visible"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '20px',
          flexWrap: 'wrap',
          gap: '10px',
        }}
      >
        <ListMeta count={total} unit="个" prefix="共" />
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            className="btn ghost"
            style={{ height: '32px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '5px' }}
            onClick={() => setShowJoinModal(true)}
          >
            <LogIn size={14} strokeWidth={1.5} />
            加入团队
          </button>
          <button
            className="btn ghost"
            style={{ height: '32px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '5px' }}
            onClick={() => setShowCreateModal(true)}
          >
            <Plus size={14} strokeWidth={1.5} />
            创建团队
          </button>
        </div>
      </motion.div>

      {/* Team cards */}
      <AnimatePresence mode="wait">
        <motion.div
          key="team-list"
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          exit={{ opacity: 0, transition: { duration: 0.15 } }}
          style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, 1fr)',
            gap: '16px',
          }}
        >
          {teams.map((team) => (
            <motion.div
              key={team.id}
              variants={staggerItem}
              className="glass-card glass-card-vertical glass-card-static"
              style={{ padding: '18px' }}
            >
              {/* Team header */}
              <div style={{ marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px', marginBottom: '8px' }}>
                  <span style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)', lineHeight: 1.35, flex: 1 }}>
                    {team.teamName}
                  </span>
                  <span
                    className={`glass-badge ${teamStatusClass[team.status] ?? 'pending'}`}
                    style={{ fontSize: '11px', padding: '2px 8px' }}
                  >
                    {teamStatusLabel[team.status] ?? '未知'}
                  </span>
                </div>

                {team.competitionName && (
                  <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginBottom: '4px' }}>
                    竞赛：{team.competitionName}
                  </div>
                )}

                {team.teamSlogan && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    <MessageSquareQuote size={12} strokeWidth={1.5} />
                    {team.teamSlogan}
                  </div>
                )}
              </div>

              {/* Team meta */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: 'var(--text-tertiary)' }}>
                  <Hash size={12} strokeWidth={1.5} />
                  团队ID：{team.id}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: 'var(--text-tertiary)' }}>
                  <Crown size={12} strokeWidth={1.5} />
                  队长：{team.leaderName ?? `用户#${team.leaderId}`}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: 'var(--text-tertiary)' }}>
                  <Users size={12} strokeWidth={1.5} />
                  成员 {team.members.length} 人
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: 'var(--text-tertiary)' }}>
                  <Calendar size={12} strokeWidth={1.5} />
                  创建于 {formatDate(team.createTime)}
                </div>
              </div>

              {/* Members list */}
              {team.members.length > 0 && (
                <div style={{ borderTop: '1px solid rgba(0,0,0,0.05)', paddingTop: '10px' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginBottom: '6px', fontWeight: '600' }}>
                    团队成员
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {team.members.map((m) => (
                      <div
                        key={m.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          fontSize: '12px',
                          padding: '4px 0',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-primary)' }}>
                          {m.studentId === team.leaderId && (
                            <Crown size={11} strokeWidth={1.5} style={{ color: '#f59e0b' }} />
                          )}
                          <span>{m.studentName ?? m.studentUsername ?? `用户#${m.studentId}`}</span>
                        </div>
                        <span style={{ fontSize: '11px', color: m.status === 1 ? 'var(--accent)' : 'var(--text-tertiary)' }}>
                          {memberStatusLabel[m.status] ?? ''}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </motion.div>
      </AnimatePresence>

      <Pagination
        current={pagination.current}
        totalPages={pagination.totalPages}
        pageSize={pagination.pageSize}
        total={pagination.total}
        onPageChange={pagination.setCurrent}
        onPageSizeChange={pagination.setPageSize}
      />

      {teams.length === 0 && !loading && (
        <EmptyState icon={Users} text="暂无团队，快去创建或加入一个吧" />
      )}

      {/* 创建团队模态框 */}
      <GlassModal open={showCreateModal} onClose={() => setShowCreateModal(false)} title="创建团队" maxWidth="400px">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-tertiary)', marginBottom: '6px' }}>
              竞赛ID <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              type="number"
              className="glass-search"
              placeholder="请输入要参加的竞赛ID"
              value={createCompId}
              onChange={(e) => setCreateCompId(e.target.value)}
              style={{ width: '100%', marginBottom: 0 }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-tertiary)', marginBottom: '6px' }}>
              团队名称 <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              className="glass-search"
              placeholder="给团队起个响亮的名字"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              maxLength={50}
              style={{ width: '100%', marginBottom: 0 }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-tertiary)', marginBottom: '6px' }}>
              团队口号
            </label>
            <input
              className="glass-search"
              placeholder="可选，展示团队风采"
              value={teamSlogan}
              onChange={(e) => setTeamSlogan(e.target.value)}
              maxLength={100}
              style={{ width: '100%', marginBottom: 0 }}
            />
          </div>
        </div>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
          <button className="btn ghost" onClick={() => setShowCreateModal(false)}>取消</button>
          <button className="btn ghost" onClick={handleCreate} disabled={creating}>
            {creating ? '创建中...' : '确认创建'}
          </button>
        </div>
      </GlassModal>

      {/* 加入团队模态框 */}
      <GlassModal open={showJoinModal} onClose={() => setShowJoinModal(false)} title="加入团队" maxWidth="380px">
        <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
          输入团队ID即可申请加入
        </div>
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-tertiary)', marginBottom: '6px' }}>
            团队ID
          </label>
          <input
            type="number"
            className="glass-search"
            placeholder="请输入团队ID"
            value={joinTeamId}
            onChange={(e) => setJoinTeamId(e.target.value)}
            style={{ width: '100%', marginBottom: 0 }}
          />
        </div>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button className="btn ghost" onClick={() => setShowJoinModal(false)}>取消</button>
          <button className="btn ghost" onClick={handleJoin} disabled={joining}>
            {joining ? '加入中...' : '申请加入'}
          </button>
        </div>
      </GlassModal>
    </>
  )
}
