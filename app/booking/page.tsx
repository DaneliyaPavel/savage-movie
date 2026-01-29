/**
 * Страница бронирования через Calendly
 */
'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

const serviceTypes = [
  { value: 'consultation', label: 'Консультация' },
  { value: 'shooting', label: 'Съемка' },
  { value: 'production', label: 'Продакшн' },
  { value: 'training', label: 'Обучение' },
]

export default function BookingPage() {
  const calendlyUrl = process.env.NEXT_PUBLIC_CALENDLY_URL || 'https://calendly.com'

  return (
    <div className="min-h-screen py-20 px-4">
      <div className="container mx-auto max-w-5xl">
        <div className="text-center mb-12">
          <h1 className="font-heading font-bold text-5xl md:text-6xl mb-4">
            Забронировать консультацию
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Выберите удобное время для обсуждения вашего проекта
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Выберите тип услуги</CardTitle>
            <CardDescription>
              После выбора услуги вы будете перенаправлены в календарь для выбора времени
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="consultation" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                {serviceTypes.map(service => (
                  <TabsTrigger key={service.value} value={service.value}>
                    {service.label}
                  </TabsTrigger>
                ))}
              </TabsList>
              {serviceTypes.map(service => (
                <TabsContent key={service.value} value={service.value} className="mt-6">
                  <div className="aspect-[16/9] w-full">
                    <iframe
                      src={calendlyUrl}
                      width="100%"
                      height="100%"
                      frameBorder="0"
                      title={`Бронирование: ${service.label}`}
                      className="rounded-lg"
                    />
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
