# Техническое задание (ТЗ)

## Цели
- Упростить запись клиентов и работу мастеров в салоне красоты
- Разделить роли: пользователь, мастер, администратор

## Основные сценарии
- Пользователь регистрируется, входит, видит свои заявки на странице **Мои записи**
- Мастер входит через отдельную вкладку, видит все заявки по своим услугам на странице **Панель мастера**
- Админ управляет мастерами, услугами, назначает услуги мастерам
- В меню профиля отображается:
  - "Панель мастера" — только для мастера
  - "Мои записи" — для обычного пользователя
  - "Админ-панель" — для администратора

## UI/UX
- На странице входа три вкладки: пользователь, мастер, админ
- Для мастера — отдельная иконка на форме входа
- Для пользователя — страница my-requests.html (таблица заявок, фильтр, поиск)
- Для мастера — master.html (таблица всех заявок по его услугам)

## Ограничения
- Бесплатная база PostgreSQL: 1 GB storage, 256 MB RAM, 0.1 CPU
- Ожидается до нескольких тысяч пользователей и десятков тысяч заявок

## Бизнес-логика
- Мастер видит только заявки по тем услугам, которые ему назначены через админку
- Пользователь видит только свои заявки
- Админ может добавлять/редактировать мастеров и услуги, назначать услуги мастерам

## Прочее
- Все роли используют JWT-токены
- Меню профиля строится динамически в зависимости от роли

## 1. Общая информация
Веб-приложение предназначено для автоматизации процесса онлайн-записи клиентов в салон красоты и управления заявками администраторами. Система должна быть удобной для пользователей и администраторов, обеспечивать быстрый доступ к информации об услугах, возможность записи и эффективное администрирование заявок.

## 2. Функциональные требования

### 2.1. Пользовательская часть
- Ознакомление с перечнем предоставляемых услуг, их описанием и стоимостью
- Просмотр контактной информации салона: адрес, телефон, email, режим работы
- Онлайн-запись на услугу: выбор услуги, даты, времени, ввод имени, телефона и комментария
- Получение подтверждения о приёме заявки после отправки формы
- Адаптивный дизайн для корректного отображения на мобильных устройствах и ПК
- Валидация данных на клиенте (проверка обязательных полей, корректности телефона и времени)

### 2.2. Административная часть
- Авторизация администратора по паролю для доступа к панели управления заявками
- Просмотр всех поступивших заявок в виде таблицы с возможностью фильтрации по дате, услуге, имени или телефону
- Возможность удаления отдельных заявок или очистки всех заявок
- Мгновенное обновление данных после выполнения действий (без перезагрузки страницы)

## 3. Серверная часть и база данных
- Сервер реализован на **Node.js** с использованием **Express**
- Взаимодействие с клиентской частью через **REST API**
- Хранение заявок в базе данных **PostgreSQL**
- Реализация следующих эндпоинтов:
  - `GET /api/requests` — получение всех заявок
  - `POST /api/requests` — добавление новой заявки
  - `DELETE /api/requests/:id` — удаление заявки по id
  - `DELETE /api/requests` — удаление всех заявок
- Обработка ошибок и возврат информативных сообщений клиенту

## 4. Требования к интерфейсу
- Современный и приятный дизайн, соответствующий тематике салона красоты
- Использование анимаций для плавного появления элементов и интерактивных компонентов (например, FAQ, кнопка "Наверх")
- Четкая структура страниц: главная, услуги, запись, контакты, админ-панель
- Поддержка русского языка

## 5. Требования к развертыванию и документации
- Возможность локального запуска проекта с помощью `npm install` и `npm start`
- Подробная инструкция по установке и запуску в файле [README.md](./README.md)
- Открытый исходный код, структурированный по папкам (отдельно клиентская и серверная части)
- Пример конфигурации подключения к базе данных в серверной части

## 6. Безопасность и защита данных
- Защита административной панели паролем
- Не хранить пароли в открытом виде в публичном репозитории
- Проверка данных на сервере для предотвращения некорректных или вредоносных запросов

## 7. Дополнительные требования
- Возможность дальнейшего расширения функционала (например, добавление новых услуг, интеграция с уведомлениями)
- Чистый, читаемый и документированный исходный код
- Соответствие современным стандартам веб-разработки 