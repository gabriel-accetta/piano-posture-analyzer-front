import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { Analysis } from '@/types/analysis'
import Image from 'next/image'

export function OverallAnalysis({
  classification,
  feedbacks,
  materials,
}: Analysis) {
  const getBackgroundColor = () => {
    switch (classification) {
      case 'Excellent':
        return 'bg-green-50 dark:bg-green-950/20'
      case 'Good':
        return 'bg-yellow-50 dark:bg-yellow-950/20'
      case 'Needs Improvement':
        return 'bg-red-50 dark:bg-red-950/20'
      default:
        return 'bg-background'
    }
  }

  const getClassificationColor = () => {
    switch (classification) {
      case 'Excellent':
        return 'text-green-700 dark:text-green-400'
      case 'Good':
        return 'text-yellow-700 dark:text-yellow-400'
      case 'Needs Improvement':
        return 'text-red-700 dark:text-red-400'
      default:
        return 'text-foreground'
    }
  }

  return (
    <div className={cn('rounded-lg p-6', getBackgroundColor())}>
      {/* Header Section */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2 text-foreground">
          Overall Analysis
        </h2>
        <p className={cn('text-xl font-semibold', getClassificationColor())}>
          {classification}
        </p>
      </div>

      {/* Feedbacks Section */}
      {feedbacks.length > 0 && (
        <div className="mb-6">
          <ul className="list-disc list-inside space-y-2">
            {feedbacks.map((feedback, index) => (
              <li key={index} className="text-foreground leading-relaxed">
                {feedback}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Materials Section */}
      {materials.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4 text-foreground">
            Recommended Materials
          </h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {materials.map((material, index) => (
              <Card key={index} className="overflow-hidden p-0">
                <a
                  href={material.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block hover:opacity-80 transition-opacity"
                >
                  {material.thumbnail && (
                    <Image
                      src={material.thumbnail || '/placeholder.svg'}
                      alt={material.title}
                      className="w-full h-40 object-cover"
                      height={240}
                      width={400}
                    />
                  )}
                  <div className="p-4">
                    <span className="text-xs font-medium text-muted-foreground uppercase">
                      {material.type}
                    </span>
                    <h4 className="text-base font-semibold mt-1 mb-2 text-foreground">
                      {material.title}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {material.description}
                    </p>
                  </div>
                </a>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
