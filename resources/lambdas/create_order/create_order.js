const Ut = require('/opt/nodejs/utils/Utilities');
const moment = require('moment-timezone');
const fetch = require("node-fetch");
const APIHandler = require('/opt/nodejs/utils/APIHandler');
const PromisesCalculator = require('/opt/nodejs/utils/PromisesCalc');


exports.handler = async (event) => {
    // TODO implement

    if (!('body' in event) || event.body == null || !Ut.isJson(event.body)) {
        return Ut.response(400, 'Hay problemas con el mensaje');
    }
    let order = JSON.parse(event.body);

    let sh_details = null;
    let offDays = null;
    try {
        const api = new APIHandler();
        sh_details = (await api.shipping_details(order.shipping_method)).data;
        offDays = (await api.offDays()).data;
        // console.log(sh_details);
        // console.log(offDays);
    } catch (error) {
        console.log(error);
        return Ut.response(400, JSON.stringify(error));
    }
    let nowDate = moment().tz('America/Bogota').format('YYYY-MM-DD HH:mm:ss');
    order.creation_date = moment(nowDate).format('YYYY-MM-DD');
    order.internal_order_number = `order_${nowDate}_${Math.floor(Math.random() * 101)}`

    const promCalc = new PromisesCalculator(order, sh_details, offDays, nowDate);
    order.promises = promCalc.calculate();


    let result = null;
    let code = 200;

    await fetch(`${process.env.URL_EXPRESSJS}/orders/create`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
            // 'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: JSON.stringify(order)
    })
    .then(function(response) {
        return response.text();
    })
    .then(function(data) {
        console.log('data = ', data);
        result = data;
    })
    .catch(function(err) {
        console.error(err);
        code = 400
    });

    return Ut.response(code, result);
};
