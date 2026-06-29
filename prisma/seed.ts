import { PrismaClient, CategoryType } from '@prisma/client'

const prisma = new PrismaClient()

const systemCategories = [
  // Expense categories
  { name: 'Alimentação', icon: 'utensils', color: '#ef4444', type: CategoryType.EXPENSE },
  { name: 'Transporte', icon: 'car', color: '#f97316', type: CategoryType.EXPENSE },
  { name: 'Moradia', icon: 'home', color: '#eab308', type: CategoryType.EXPENSE },
  { name: 'Saúde', icon: 'heart-pulse', color: '#22c55e', type: CategoryType.EXPENSE },
  { name: 'Educação', icon: 'graduation-cap', color: '#3b82f6', type: CategoryType.EXPENSE },
  { name: 'Lazer', icon: 'gamepad-2', color: '#8b5cf6', type: CategoryType.EXPENSE },
  { name: 'Vestuário', icon: 'shirt', color: '#ec4899', type: CategoryType.EXPENSE },
  { name: 'Serviços', icon: 'wrench', color: '#14b8a6', type: CategoryType.EXPENSE },
  { name: 'Tecnologia', icon: 'laptop', color: '#06b6d4', type: CategoryType.EXPENSE },
  { name: 'Beleza', icon: 'sparkles', color: '#f472b6', type: CategoryType.EXPENSE },
  { name: 'Pets', icon: 'paw-print', color: '#a78bfa', type: CategoryType.EXPENSE },
  { name: 'Viagens', icon: 'plane', color: '#34d399', type: CategoryType.EXPENSE },
  { name: 'Outros Gastos', icon: 'more-horizontal', color: '#94a3b8', type: CategoryType.EXPENSE },
  // Income categories
  { name: 'Salário', icon: 'briefcase', color: '#10b981', type: CategoryType.INCOME },
  { name: 'Freelance', icon: 'laptop-2', color: '#059669', type: CategoryType.INCOME },
  { name: 'Investimentos', icon: 'trending-up', color: '#0284c7', type: CategoryType.INCOME },
  { name: 'Vendas', icon: 'shopping-bag', color: '#7c3aed', type: CategoryType.INCOME },
  { name: 'Presente', icon: 'gift', color: '#db2777', type: CategoryType.INCOME },
  { name: 'Aluguel', icon: 'building', color: '#d97706', type: CategoryType.INCOME },
  { name: 'Outros Rendimentos', icon: 'plus-circle', color: '#64748b', type: CategoryType.INCOME },
]

async function main() {
  console.log('🌱 Seeding database...')

  for (const category of systemCategories) {
    await prisma.category.upsert({
      where: {
        id: `system-${category.name.toLowerCase().replace(/\s+/g, '-')}`,
      },
      update: {},
      create: {
        id: `system-${category.name.toLowerCase().replace(/\s+/g, '-')}`,
        ...category,
        isSystem: true,
        userId: null,
      },
    })
  }

  console.log(`✅ Seeded ${systemCategories.length} system categories`)
  console.log('🎉 Seed complete!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
