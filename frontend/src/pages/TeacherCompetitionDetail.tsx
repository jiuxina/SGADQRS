import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'motion/react'
import EmptyState from '../components/EmptyState'
import { ListSkeleton } from '../components/PageSkeleton'
import PageTabs, { usePageTab } from '../components/PageTabs'
import CompetitionInfoPanel from '../components/CompetitionInfoPanel'
import TeacherGrades from './TeacherGrades'
import { competitionApi, registrationApi } from '../api'
import type { CompetitionItem, TeamItem } from '../api/types'
import { getStatusBadge } from '../utils/statusBadge'
import { toast } from '../components/toastUtils'
import { fadeSlideUp } from '../motion/variants'

const DETAIL_TABS = [
  { key: 'info', label: '基本信息' },
  { key: 'teams', label: '参赛队伍' },
  { key: 'grades', label: '成绩管理' },
]

/** 教师端竞赛详情枢纽：基本信息 / 参赛队伍（只读）/ 成绩录入，围绕单场竞赛的集中操作入口 */
export default function TeacherCompetitionDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const compId = Number(id)
  const [comp, setComp] = useState<CompetitionItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [pageTab, setPageTab] = usePageTab(DETAIL_TABS)

  useEffect(() => {
    if (!compId) return
    setLoading(true)
    competitionApi.getById(compId).then(setComp)
      .catch((e) => { toast.error('加载竞赛详情失败'); console.error(e) })
      .finally(() => setLoading(false))
  }, [compId])

  if (loading && !comp) return <ListSkeleton />
  if (!comp) return <EmptyState text="竞赛不存在或已删除" />

  return (
    <>
      <PageTabs tabs={DETAIL_TABS} active={pageTab} onChange={setPageTab} />

      {pageTab === 'info' && (
        <>
          <motion.div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '12px' }} variants={fadeSlideUp} initial="hidden" animate="visible">
            <button
              className="btn primary filled-primary"
              style={{ height: '32px', fontSize: '12px' }}
              onClick={() => navigate(`/teacher/competitions/${compId}/edit`)}
            >
              编辑竞赛
            </button>
          </motion.div>
          <motion.div className="glass-card glass-card-vertical glass-card-static" style={{ padding: '16px' }} variants={fadeSlideUp} initial="hidden" animate="visible" transition={{ delay: 0.05 }}>
            <CompetitionInfoPanel comp={comp} />
          </motion.div>
        </>
      )}

      {pageTab === 'teams' && <TeamsTab competitionId={compId} />}
      {pageTab === 'grades' && <TeacherGrades presetCompetitionId={compId} />}
    </>
  )
}

/** 参赛队伍只读列表（审核由管理员在「队伍审核」完成） */
function TeamsTab({ competitionId }: { competitionId: number }) {
  const navigate = useNavigate()
  const [teams, setTeams] = useState<TeamItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    registrationApi.teamList({ current: 1, size: 100, competitionId })
      .then((res) => setTeams(res.records))
      .catch(() => toast.error('加载参赛队伍失败'))
      .finally(() => setLoading(false))
  }, [competitionId])

  if (loading) return <ListSkeleton />
  if (teams.length === 0) return <EmptyState text="暂无参赛队伍" />

  return (
    <div className="glass-card glass-card-vertical glass-card-static" style={{ padding: '0', overflowX: 'auto' }}>
      <table className="data-table">
        <thead>
          <tr>
            <th>队伍名称</th><th>队长</th><th>指导老师</th><th>成员数</th><th>状态</th>
          </tr>
        </thead>
        <tbody>
          {teams.map((team) => {
            const badge = getStatusBadge(team.status, 'team')
            return (
              <tr key={team.id}>
                <td>
                  <span
                    title="查看队伍详情"
                    onClick={() => navigate(`/teacher/teams/detail/${team.id}`)}
                    style={{ fontWeight: 600, cursor: 'pointer', color: 'var(--accent)' }}
                    onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
                    onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}
                  >
                    {team.teamName}
                  </span>
                </td>
                <td style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>{team.leaderName || '-'}</td>
                <td style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>{team.teacherName || '-'}</td>
                <td>{team.members?.length || 0}</td>
                <td>
                  <span className={`glass-badge ${badge.cls}`} style={{ fontSize: '12px', padding: '2px 8px' }}>{badge.label}</span>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
