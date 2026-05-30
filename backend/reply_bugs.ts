import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const feedbacks = await prisma.feedback.findMany({
    where: {
      type: 'Баг-репорт'
    }
  });

  console.log(`Найдено ${feedbacks.length} баг-репортов.`);

  for (const feedback of feedbacks) {
    let responseText = '';
    
    // Определяем ответ в зависимости от сообщения
    if (feedback.message.includes('верстк') || feedback.message.includes('Расположение на экране')) {
      responseText = 'Здравствуйте! Спасибо за обращение. Ошибка с версткой и видимостью кнопок была успешно исправлена. Теперь таблица адаптируется под размер экрана, и при необходимости появляется горизонтальная прокрутка. С уважением, izumi.';
    } else if (feedback.message.includes('Сотрудник, создавший Заявку, должен подтвердить')) {
      responseText = 'Здравствуйте! Спасибо за предложение. Мы добавили процесс подтверждения: теперь, когда Завхоз переводит заявку в статус "Выполнено", у автора заявки появляется кнопка "Получил". После нажатия заявка переходит в статус "Завершена". С уважением, izumi.';
    } else if (feedback.message.includes('1-3 года') || feedback.message.includes('7-10 лет')) {
      responseText = 'Здравствуйте! Ошибка с возрастными категориями была исправлена. В выпадающем списке теперь корректные значения: 7-10 лет и 11-17 лет. Спасибо за внимательность! С уважением, izumi.';
    } else if (feedback.message.includes('Рецепты и ингредиенты')) {
      responseText = 'Здравствуйте! Спасибо за замечание. Название страницы и подпункта успешно изменено на "Блюда". С уважением, izumi.';
    } else if (feedback.message.includes('отсутствуют галочки для одобрения')) {
      responseText = 'Здравствуйте! Проблема исправлена. Для Завхоза были добавлены кнопки быстрых действий (взять в работу, выполнить) прямо в таблице. Также мы улучшили отображение самой таблицы, чтобы предотвратить сужение кнопок. С уважением, izumi.';
    } else {
      responseText = 'Здравствуйте! Ваша заявка об ошибке была успешно рассмотрена и проблема устранена. С уважением, izumi.';
    }

    await prisma.feedback.update({
      where: { id: feedback.id },
      data: {
        status: 'RESOLVED',
        response: responseText,
        resolvedAt: new Date(),
      }
    });
    
    console.log(`Ответили на баг #${feedback.id}`);
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
