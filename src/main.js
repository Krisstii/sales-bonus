/**
 * Функция для расчета выручки
 * @param purchase запись о покупке
 * @param _product карточка товара
 * @returns {number}
 */
function calculateSimpleRevenue(purchase, _product) {
   // @TODO: Расчет выручки от операции
const discount = 1 - purchase.discount / 100;
  return purchase.sale_price * purchase.quantity * discount;

}

/**
 * Функция для расчета бонусов
 * @param index порядковый номер в отсортированном массиве
 * @param total общее число продавцов
 * @param seller карточка продавца
 * @returns {number}
 */
function calculateBonusByProfit(index, total, seller) {
    // @TODO: Расчет бонуса от позиции в рейтинге
    // const { profit } = seller;
//   const profit = seller.profit !== undefined ? seller.profit : (seller.totalProfit || 0);

    const profit =
    seller.profit !== undefined ? seller.profit : seller.totalProfit || 0;

     if (index === 0) {
    return profit * 0.15;
  } else if (index === 1 || index === 2) {
    return profit * 0.1;
  } else if (index === total - 1) {
    return 0;
  } else {
    return profit * 0.05;
  }

}

/**
 * Функция для анализа данных продаж
 * @param data
 * @param options
 * @returns {{revenue, top_products, bonus, name, sales_count, profit, seller_id}[]}
 */
function analyzeSalesData(data, options) {
    const { calculateRevenue, calculateBonus } = options;
    // @TODO: Проверка входных данных

      if (
    !data ||
    !Array.isArray(data.sellers) ||
    data.sellers.length === 0 ||
    !Array.isArray(data.products) ||
    data.products.length === 0 ||
    !Array.isArray(data.purchase_records) ||
    data.purchase_records.length === 0
  ) {
    throw new Error("Некорректные входные данные");
  }

    // @TODO: Проверка наличия опций
    // if(typeof options !== "object" || typeof options.calculateBonusByProfit !== 'function' || typeof options.calculateSimpleRevenue !== 'function') {
    //     throw new Error ("Некорректные входные данные");
    // }
  if (!options || typeof options !== "object") {
    throw new Error("Некорректные входные данные: options не объект");
  }

  if (
    typeof calculateRevenue !== "function" ||
    typeof calculateBonus !== "function"
  ) {
    throw new Error(
      "Некорректные входные данные: calculateSimpleRevenue или calculateBonusByProfit не функции"
    );
  }
    

    // @TODO: Подготовка промежуточных данных для сбора статистики

   const sellerStats = data.sellers.map((seller) => ({
    id: seller.id,
    firstName: seller.first_name,
    lastName: seller.last_name,
    position: seller.position,
    startDate: seller.start_date,
    totalRevenue: 0,
    totalProfit: 0,
    totalSales: 0,
    totalItems: 0,
    products_sold: {},
    bonus: 0,
    top_products: [],
  }));

    // @TODO: Индексация продавцов и товаров для быстрого доступа

     const sellerIndex = sellerStats.reduce(
    (result, seller) => ({
      ...result,
      [seller.id]: seller,
    }),
    {}
  );

   const productIndex = data.products.reduce(
    (result, product) => ({
      ...result,
      [product.sku]: product,
    }),
    {}
  );

    // @TODO: Расчет выручки и прибыли для каждого продавца

    data.purchase_records.forEach(record => { // Чек 
        const seller = sellerIndex[record.seller_id]; // Продавец
        // Увеличить количество продаж 
         seller.totalSales += 1;
        // Увеличить общую сумму выручки всех продаж
        seller.totalRevenue+=record.total_amount;


        // Расчёт прибыли для каждого товара
        record.items.forEach(item => {
            const product = productIndex[item.sku]; // Товар

            // Посчитать себестоимость (cost) товара как product.purchase_price, умноженную на количество товаров из чека
            const cost = product.purchase_price * item.quantity;

            // Посчитать выручку (revenue) с учётом скидки через функцию calculateRevenue
            const revenue = calculateSimpleRevenue(item, product);

            // Посчитать прибыль: выручка минус себестоимость
            const profit = revenue - cost;

        // Увеличить общую накопленную прибыль (profit) у продавца  
            seller.totalProfit+=profit;


            // Учёт количества проданных товаров
            if (!seller.products_sold[item.sku]) {
                seller.products_sold[item.sku] = 0;
            } 
            
            // Увеличить число всех проданных товаров у продавца на количество проданных товаров в конкретном чеке 
            seller.products_sold[item.sku] += item.quantity;
            
        });
 });

    // @TODO: Сортировка продавцов по прибыли
    sellerStats.sort((a, b)=> b.totalProfit - a.totalProfit);

    // @TODO: Назначение премий на основе ранжирования
       sellerStats.forEach((seller, index) => {
        seller.bonus = calculateBonus(index, sellerStats.length, seller);// Считаем бонус

       // Формируем топ-10 товаров
        seller.top_products = Object.entries(seller.products_sold).map(([sku, quantity]) => ({
             sku,
        name: productIndex[sku]?.name || "Unknown",
        quantity,
        })).sort((a, b)=> b.quantity - a.quantity).slice(0, 10);
}); 

    // @TODO: Подготовка итоговой коллекции с нужными полями
    return sellerStats.map((seller) => ({
    seller_id: seller.id,
    name: `${seller.firstName} ${seller.lastName}`,
    revenue: +seller.totalRevenue.toFixed(2),
    profit: +seller.totalProfit.toFixed(2),
    sales_count: seller.totalSales,
    top_products: seller.top_products.map((product) => ({
      sku: product.sku,
      quantity: product.quantity,
    })),
    bonus: +seller.bonus.toFixed(2),
  }));
}
