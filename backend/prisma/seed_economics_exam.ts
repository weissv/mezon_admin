import { PrismaClient, ExamQuestionType, ExamStatus } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Seed file for Economics Control Test #1
 * Based on the provided HTML exam file
 */
async function seedEconomicsExam() {
  console.log('🎓 Creating Economics Control Test #1...');

  // Find a teacher user to assign as creator (or create one if needed)
  let teacher = await prisma.user.findFirst({
    where: {
      role: { in: ['TEACHER', 'DIRECTOR', 'DEPUTY'] }
    }
  });

  if (!teacher) {
    console.log('⚠️ No teacher found, creating a default teacher user...');
    teacher = await prisma.user.create({
      data: {
        email: 'economics.teacher@school.edu',
        password: '$2b$10$rBGHqUQYeH4VQQzxY8Qey.NhZKdnVgLl1hl6TRXvLNJPJJKYJ4D3u', // "password123"
        fullName: 'Economics Teacher',
        role: 'TEACHER',
      }
    });
  }

  // Check if exam already exists
  const existingExam = await prisma.exam.findFirst({
    where: { title: 'Рубежный контроль по экономике №1' }
  });

  if (existingExam) {
    console.log('⚠️ Economics exam already exists, skipping...');
    return existingExam;
  }

  // Create the exam
  const exam = await prisma.exam.create({
    data: {
      title: 'Рубежный контроль по экономике №1',
      description: 'Темы: Введение, Экономические системы, Производство, Деньги, Рынок, Кругооборот. Максимум — 70 баллов.',
      subject: 'Экономика',
      grade: '10-11',
      timeLimitMinutes: 45,
      passingScore: 42, // 60% of 70
      totalPoints: 70,
      status: ExamStatus.DRAFT,
      creatorId: teacher.id,
      questions: {
        create: [
          // Question 1: Problem of Choice and Opportunity Cost
          {
            orderIndex: 1,
            type: ExamQuestionType.SINGLE_CHOICE,
            questionText: '[RU] Проблема выбора и альтернативная стоимость\n\nВы решили потратить 2 часа на подготовку к этой контрольной вместо того, чтобы смотреть свой любимый сериал. Какова альтернативная стоимость вашего решения?',
            questionTextEn: '[EN] Problem of Choice and Opportunity Cost\n\nYou decided to spend 2 hours preparing for this test instead of watching your favorite TV show. What is the opportunity cost of your decision?',
            options: JSON.stringify([
              'Просмотр сериала (удовольствие от него)',
              'Время, затраченное на учёбу',
              'Деньги на подписку стриминга',
              'Оценка за контрольную'
            ]),
            optionsEn: JSON.stringify([
              'Watching the TV show (enjoyment from it)',
              'Time spent studying',
              'Money for streaming subscription',
              'Grade for the test'
            ]),
            correctAnswer: 'A',
            points: 2,
          },
          // Question 2: Economic Systems
          {
            orderIndex: 2,
            type: ExamQuestionType.SINGLE_CHOICE,
            questionText: '[UZ] Iqtisodiy tizimlar / [RU] Экономические системы\n\nQaysi iqtisodiy tizimda "Nima ishlab chiqarish kerak?", "Qanday ishlab chiqarish kerak?" va "Kim uchun?" degan savollarga an\'analar va urf-odatlar javob beradi?',
            questionTextEn: '[EN] Economic Systems\n\nIn which economic system do traditions and customs answer the questions "What to produce?", "How to produce?" and "For whom?"?',
            options: JSON.stringify([
              'Bozor iqtisodiyoti / Рыночная экономика',
              'Buyruqbozlik iqtisodiyoti / Командная экономика',
              'An\'anaviy iqtisodiyot / Традиционная экономика',
              'Aralash iqtisodiyot / Смешанная экономика'
            ]),
            optionsEn: JSON.stringify([
              'Market economy',
              'Command economy',
              'Traditional economy',
              'Mixed economy'
            ]),
            correctAnswer: 'C',
            points: 2,
          },
          // Question 3: Factors of Production (Multiple Choice)
          {
            orderIndex: 3,
            type: ExamQuestionType.MULTIPLE_CHOICE,
            questionText: '[EN] Factors of Production\n\nWhich of the following are considered primary factors of production in economics?',
            options: JSON.stringify([
              'Land / Земля',
              'Labor / Труд',
              'Capital / Капитал',
              'Entrepreneurship / Предпринимательство',
              'Money / Деньги',
              'Technology / Технология'
            ]),
            correctAnswer: 'A,B,C,D',
            points: 3,
          },
          // Question 4: Division of Labor (Multiple Choice)
          {
            orderIndex: 4,
            type: ExamQuestionType.MULTIPLE_CHOICE,
            questionText: '[RU] Разделение труда и специализация\n\nК чему обычно приводит углубление разделения труда на производстве (например, конвейер Генри Форда)?',
            options: JSON.stringify([
              'Повышение производительности труда',
              'Снижение качества продукции',
              'Увеличение зависимости от других работников',
              'Возможность масштабного производства',
              'Уменьшение затрат на обучение работников'
            ]),
            correctAnswer: 'A,C,D,E',
            points: 3,
          },
          // Question 5: Functions of Money
          {
            orderIndex: 5,
            type: ExamQuestionType.SINGLE_CHOICE,
            questionText: '[RU] Функции денег\n\nВ какой ситуации деньги выполняют функцию "Мера стоимости"?',
            options: JSON.stringify([
              'Вы покупаете хлеб в магазине',
              'Вы копите деньги на отпуск',
              'Цена телефона указана как 5 000 000 сум',
              'Вы возвращаете другу долг через Payme'
            ]),
            correctAnswer: 'C',
            points: 2,
          },
          // Question 6: Types of Markets
          {
            orderIndex: 6,
            type: ExamQuestionType.SINGLE_CHOICE,
            questionText: '[UZ] Bozor turlari / [RU] Типы рынков\n\nAgar bozorda bir nechta yirik kompaniya hukmronlik qilsa (masalan, mobil aloqa operatorlari yoki avtomobil ishlab chiqaruvchilar), bu bozor qanday ataladi?',
            questionTextEn: '[EN] Types of Markets\n\nIf a market is dominated by several large companies (e.g., mobile operators or car manufacturers), what is this market called?',
            options: JSON.stringify([
              'Mukammal raqobat / Совершенная конкуренция',
              'Monopoliya / Монополия',
              'Oligopoliya / Олигополия',
              'Monopolistik raqobat / Монополистическая конкуренция'
            ]),
            optionsEn: JSON.stringify([
              'Perfect competition',
              'Monopoly',
              'Oligopoly',
              'Monopolistic competition'
            ]),
            correctAnswer: 'C',
            points: 2,
          },
          // Question 7: Law of Demand
          {
            orderIndex: 7,
            type: ExamQuestionType.SINGLE_CHOICE,
            questionText: '[EN] Law of Demand\n\nAccording to the Law of Demand, what happens when the price of a good decreases (ceteris paribus)?',
            options: JSON.stringify([
              'Quantity demanded decreases',
              'Quantity demanded increases',
              'Quantity supplied increases',
              'No change in quantity demanded'
            ]),
            correctAnswer: 'B',
            points: 2,
          },
          // Question 8: Market Equilibrium
          {
            orderIndex: 8,
            type: ExamQuestionType.SINGLE_CHOICE,
            questionText: '[RU] Рыночное равновесие\n\nГосударство установило потолок цен на бензин НИЖЕ равновесного уровня. Что произойдёт на рынке?',
            options: JSON.stringify([
              'Возникнет избыток предложения',
              'Возникнет дефицит',
              'Рынок останется в равновесии',
              'Спрос сократится'
            ]),
            correctAnswer: 'B',
            points: 2,
          },
          // Question 9: Circular Flow - True/False
          {
            orderIndex: 9,
            type: ExamQuestionType.TRUE_FALSE,
            questionText: '[RU] Кругооборот в экономике\n\nВерно ли утверждение: "В модели кругооборота домохозяйства являются собственниками факторов производства и предлагают их на рынке ресурсов"?',
            correctAnswer: 'TRUE',
            points: 2,
          },
          // Question 10: Text Long - Essay Question
          {
            orderIndex: 10,
            type: ExamQuestionType.TEXT_LONG,
            questionText: '[RU] Эссе: Экономические системы\n\nСравните рыночную и командную экономические системы. Назовите по 2 преимущества и 2 недостатка каждой системы. Приведите примеры стран с каждым типом экономики.',
            keyPoints: JSON.stringify([
              'Рыночная экономика: преимущества - свобода выбора, эффективность распределения ресурсов',
              'Рыночная экономика: недостатки - неравенство, провалы рынка',
              'Командная экономика: преимущества - социальное равенство, стабильность',
              'Командная экономика: недостатки - неэффективность, отсутствие стимулов',
              'Примеры стран'
            ]),
            points: 10,
          },
          // Question 11: Problem - Math Calculation
          {
            orderIndex: 11,
            type: ExamQuestionType.PROBLEM,
            questionText: '[RU] Задача: Альтернативная стоимость\n\nСтудент может заработать 100 000 сум в час, работая репетитором. Он решил потратить 3 часа на подготовку к экзамену вместо работы. Вычислите альтернативную стоимость его решения в сумах.',
            expectedAnswer: '300000',
            points: 5,
          },
          // Question 12: Problem - Supply and Demand
          {
            orderIndex: 12,
            type: ExamQuestionType.PROBLEM,
            questionText: '[EN] Problem: Supply and Demand\n\nThe demand function is Qd = 100 - 2P and the supply function is Qs = 20 + 3P. Find the equilibrium price.',
            expectedAnswer: '16',
            keyPoints: JSON.stringify([
              '100 - 2P = 20 + 3P',
              '80 = 5P',
              'P = 16'
            ]),
            points: 5,
          },
          // Question 13: Text Short
          {
            orderIndex: 13,
            type: ExamQuestionType.TEXT_SHORT,
            questionText: '[RU] Краткий ответ\n\nНазовите экономическую систему, которая преобладает в большинстве современных развитых стран (одно слово).',
            correctAnswer: 'смешанная',
            points: 2,
          },
          // Question 14: GDP Components (Multiple Choice)
          {
            orderIndex: 14,
            type: ExamQuestionType.MULTIPLE_CHOICE,
            questionText: '[RU] Компоненты ВВП\n\nКакие из следующих элементов включаются в расчёт ВВП по методу расходов?',
            options: JSON.stringify([
              'Потребительские расходы домохозяйств (C)',
              'Инвестиции бизнеса (I)',
              'Государственные закупки (G)',
              'Чистый экспорт (NX)',
              'Трансфертные платежи',
              'Покупка акций на вторичном рынке'
            ]),
            correctAnswer: 'A,B,C,D',
            points: 3,
          },
          // Question 15: Inflation Types
          {
            orderIndex: 15,
            type: ExamQuestionType.SINGLE_CHOICE,
            questionText: '[RU] Типы инфляции\n\nЕсли годовой уровень инфляции составляет 3%, как называется такая инфляция?',
            options: JSON.stringify([
              'Гиперинфляция',
              'Галопирующая инфляция',
              'Умеренная (ползучая) инфляция',
              'Дефляция'
            ]),
            correctAnswer: 'C',
            points: 2,
          },
          // Question 16: Essay on Money Functions
          {
            orderIndex: 16,
            type: ExamQuestionType.TEXT_LONG,
            questionText: '[RU] Эссе: Функции денег в современной экономике\n\nОпишите все основные функции денег (не менее 4) и приведите конкретные примеры из повседневной жизни для каждой функции.',
            keyPoints: JSON.stringify([
              'Средство обращения - покупка товаров',
              'Мера стоимости - ценники в магазинах',
              'Средство накопления - банковские сбережения',
              'Средство платежа - оплата коммунальных услуг',
              'Мировые деньги - международная торговля'
            ]),
            points: 10,
          },
          // Question 17: Elasticity Problem
          {
            orderIndex: 17,
            type: ExamQuestionType.PROBLEM,
            questionText: '[EN] Problem: Price Elasticity of Demand\n\nWhen the price of a product increased from $10 to $12, quantity demanded fell from 100 to 80 units. Calculate the price elasticity of demand (use midpoint method and round to 2 decimal places).',
            expectedAnswer: '1.00',
            keyPoints: JSON.stringify([
              'Midpoint method: Ed = ((Q2-Q1)/((Q2+Q1)/2)) / ((P2-P1)/((P2+P1)/2))',
              'Change in Q = -20, Average Q = 90',
              'Change in P = 2, Average P = 11',
              '% change in Q = -20/90 = -22.22%',
              '% change in P = 2/11 = 18.18%',
              'Ed = |-22.22/18.18| = 1.00 (unit elastic)'
            ]),
            points: 5,
          },
          // Question 18: True/False - Monopoly
          {
            orderIndex: 18,
            type: ExamQuestionType.TRUE_FALSE,
            questionText: '[RU] Монополия\n\nВерно ли утверждение: "В условиях монополии цена товара обычно выше, а объём производства ниже, чем в условиях совершенной конкуренции"?',
            correctAnswer: 'TRUE',
            points: 2,
          },
          // Question 19: Short Answer - Economics Term
          {
            orderIndex: 19,
            type: ExamQuestionType.TEXT_SHORT,
            questionText: '[EN] Short Answer\n\nWhat is the economic term for a situation where resources are used in the most efficient way possible, and no one can be made better off without making someone else worse off?',
            correctAnswer: 'Pareto efficiency',
            points: 2,
          },
          // Question 20: Final Problem - Profit Calculation
          {
            orderIndex: 20,
            type: ExamQuestionType.PROBLEM,
            questionText: '[RU] Задача: Расчёт прибыли\n\nФирма производит 1000 единиц товара. Переменные издержки на единицу = 50 сум, постоянные издержки = 20 000 сум, цена продажи = 100 сум за единицу. Рассчитайте экономическую прибыль фирмы.',
            expectedAnswer: '30000',
            keyPoints: JSON.stringify([
              'Общая выручка = 1000 × 100 = 100 000 сум',
              'Переменные издержки = 1000 × 50 = 50 000 сум',
              'Постоянные издержки = 20 000 сум',
              'Общие издержки = 50 000 + 20 000 = 70 000 сум',
              'Прибыль = 100 000 - 70 000 = 30 000 сум'
            ]),
            points: 6,
          },
        ]
      }
    }
  });

  console.log(`✅ Created Economics Exam: ${exam.title}`);
  console.log(`   ID: ${exam.id}`);
  console.log(`   Public Token: ${exam.publicToken}`);
  console.log(`   Questions: 20`);
  console.log(`   Total Points: 70`);

  return exam;
}

async function main() {
  try {
    await seedEconomicsExam();
    console.log('\n🎉 Economics exam seed completed successfully!');
  } catch (error) {
    console.error('❌ Error seeding economics exam:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main();
