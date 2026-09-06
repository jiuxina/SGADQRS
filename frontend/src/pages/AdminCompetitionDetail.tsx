import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'motion/react'
import EmptyState from '../components/EmptyState'
import { ListSkeleton } from '../components/PageSkeleton'
import PageTabs, { usePageTab } from '../components/PageTabs'
import CompetitionInfoPanel from '../components/CompetitionInfoPanel'
import AdminTeams from './AdminTeams'
import AdminGrades from './AdminGrades'
import { competitionApi } from '../api'
import type { CompetitionItem } from '../api/types'
import { toast } from '../components/toastUtils'
import { fadeSlideUp } from '../motion/variants'

const DETAIL_TABS = [
  { key: 'info', label: '基本信息' },
  { key: 'teams', label: '队伍审核' },
  { key: 'grades', label: '成绩管理' },
]

/** 管理端竞赛详情枢纽：基本信息 / 队伍审核 / 成绩管理，围绕单场竞赛的集中操作入口 */
export default function AdminCompetitionDetail() {
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
              onClick={() => navigate(`/admin/competitions/${compId}/edit`)}
            >
              编辑竞赛
            </button>
          </motion.div>
          <motion.div className="glass-card glass-card-vertical glass-card-static" style={{ padding: '16px' }} variants={fadeSlideUp} initial="hidden" animate="visible" transition={{ delay: 0.05 }}>
            <CompetitionInfoPanel comp={comp} />
          </motion.div>
        </>
      )}

      {pageTab === 'teams' && <AdminTeams presetCompetitionId={compId} />}
      {pageTab === 'grades' && <AdminGrades presetCompetitionId={compId} />}
    </>
  )
}
