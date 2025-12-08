export interface Material {
  type: "Book" | "Video" | "Article"
  title: string
  description: string
  link: string
  thumbnail: string
}

export interface Analysis {
  classification: 'Excellent' | 'Good' | 'Needs Improvement'
  feedbacks: string[]
  materials: Material[]
}