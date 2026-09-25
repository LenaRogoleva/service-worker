/**
 * Контракт обмена сообщениями между страницей (index.html) и сервис-воркером (thread.js).
 * Подключается на странице через <script src="./contract.js"> и в воркере через importScripts.
 *
 * Команды страница → SW: { name: Commands.*, data: { timeout: number } }
 *  - START       — вернуть результат из кеша, а если его нет — посчитать slowFunction(timeout) и сохранить в кеш
 *  - RECALCULATE — посчитать slowFunction(timeout) заново и перезаписать кеш
 *  timeout — длительность расчёта в мс
 *
 * Ответы SW → страница (только клиенту, приславшему команду):
 *  - { name: Responses.RESULT, data: { value: number, fromCache: boolean } }
 *  - { name: Responses.ERROR, data: { message: string } }
 *
 * Удаление SW выполняет сама страница: очищает кеш CACHE_NAME и вызывает registration.unregister().
 */
const Commands = Object.freeze({
    START: 'start',
    RECALCULATE: 'recalculate'
});

const Responses = Object.freeze({
    RESULT: 'result',
    ERROR: 'error'
});

/** Имя хранилища Cache API, в котором лежит результат */
const CACHE_NAME = 'slow-function';

/** Ключ записи с результатом внутри CACHE_NAME */
const RESULT_URL = './slow-function-result';
