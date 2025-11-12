/**
 * ULE - PROFILE SKELETON
 * Loading state para la página de perfil
 */

import { Card, CardHeader, CardBody } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export function ProfileSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <Card className="border-primary/20 bg-gradient-to-r from-primary/10 to-primary/5">
        <CardBody>
          <div className="flex items-center gap-6">
            <Skeleton className="h-20 w-20 rounded-full" />
            <div className="flex-1 space-y-3">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-64" />
              <Skeleton className="h-6 w-32" />
            </div>
            <Skeleton className="h-10 w-32" />
          </div>
        </CardBody>
      </Card>

      {/* Sections Skeleton */}
      {[1, 2, 3, 4].map((i) => (
        <Card key={i}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <Skeleton className="h-6 w-48" />
              </div>
              <Skeleton className="h-9 w-24" />
            </div>
          </CardHeader>
          <CardBody>
            <div className="grid gap-4 sm:grid-cols-2">
              {[1, 2, 3, 4].map((j) => (
                <div key={j} className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-6 w-full" />
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      ))}

      {/* Security Section Skeleton */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-lg" />
            <Skeleton className="h-6 w-40" />
          </div>
        </CardHeader>
        <CardBody>
          <div className="space-y-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        </CardBody>
      </Card>

      {/* Danger Zone Skeleton */}
      <Card className="border-red-200 bg-red-50 dark:bg-red-900/20">
        <CardHeader>
          <div className="flex items-center gap-3">
            <Skeleton className="h-6 w-6" />
            <Skeleton className="h-6 w-32" />
          </div>
        </CardHeader>
        <CardBody>
          <Skeleton className="h-16 w-full" />
        </CardBody>
      </Card>
    </div>
  )
}
