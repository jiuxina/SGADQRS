import { useSearchParams } from 'react-router-dom'

export interface PageTab {
  key: string
  label: string
}

/**
 * 页内子标签状态：以 ?tab= 查询参数持久化，默认标签不写入参数，
 * 便于旧路径重定向和入口链接直达某个子页。
 */
export function usePageTab(tabs: PageTab[], param = 'tab'): [string, (key: string) => void] {
  const [searchParams, setSearchParams] = useSearchParams()
  const active = searchParams.get(param) || tabs[0]?.key || ''
  const setActive = (key: string) => {
    const next = new URLSearchParams(searchParams)
    if (key === tabs[0]?.key) next.delete(param)
    else next.set(param, key)
    setSearchParams(next)
  }
  return [active, setActive]
}

interface PageTabsProps {
  tabs: PageTab[]
  active: string
  onChange: (key: string) => void
}

export default function PageTabs({ tabs, active, onChange }: PageTabsProps) {
  return (
    <div className="chip-row" style={{ marginBottom: '12px' }}>
      {tabs.map((tab) => (
        <button
          key={tab.key}
          className={`chip ${active === tab.key ? 'active' : ''}`}
          onClick={() => onChange(tab.key)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}
