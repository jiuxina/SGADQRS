export interface EditGradeOptions {
  title?: string
  studentName: string
  defaultScore?: number | null
  defaultRanking?: number | null
  defaultAwardLevel?: number | null
  defaultRemark?: string | null
  defaultCertificateUrl?: string | null
  confirmText?: string
  cancelText?: string
  awards?: Array<{ name: string; level: number }>
}

export interface EditGradeResult {
  score: number
  remark: string
  ranking: number | null
  awardLevel: number | null
  certificateUrl: string | null
}

let globalEditGrade: ((options: EditGradeOptions) => Promise<EditGradeResult | null>) | null = null

export function setGlobalEditGrade(fn: ((options: EditGradeOptions) => Promise<EditGradeResult | null>) | null) {
  globalEditGrade = fn
}

/** 全局调用方法 */
export function editGradeDialog(options: EditGradeOptions): Promise<EditGradeResult | null> {
  if (!globalEditGrade) return Promise.resolve(null)
  return globalEditGrade(options)
}
