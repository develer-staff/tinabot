// Description:
//   Script per fare la lista dei piatti da ordinare al TuttoBene
//
// Commands:
//   hubot per me <ordine> - aggiunge <ordine> all'ordine dell'utente
//   hubot per me niente - cancella il proprio ordine
//   hubot ordine - pubblica i dishes ordinati
//   TB - hubot ha sempre voglia di TuttoBene!
//
// Notes:
//   <optional notes required for the script>
//
// Author:
//   nolith, tommyblue

module.exports = function (robot) {
  var initializeEmptyOrder = function () {
    return {
      timestamp: new Date(),
      dishes: {},
      users: {}
    };
  };

  var getOrder = function (msg) {
    var order = robot.brain.get('order') || initializeEmptyOrder();

    if (typeof order.timestamp === 'string') {
      order.timestamp = new Date(order.timestamp);
    }

    if (isNotToday(order.timestamp)) {
      if (msg !== undefined) {
        msg.emote('Cancello l\'ordine del ' + order.timestamp);
      }

      order = initializeEmptyOrder();
    }

    return order;
  };

  var isNotToday = function (dateToCheck) {
    var actualDate = new Date();
    return dateToCheck.getDate() != actualDate.getDate() ||
           dateToCheck.getMonth() != actualDate.getMonth() ||
           dateToCheck.getFullYear() != actualDate.getFullYear();
  };

  var clearUserOrder = function (order, user) {
    var dish = order.users[user.id];

    if (dish !== undefined && order.dishes[dish] !== undefined) {
      var idx = order.dishes[dish].indexOf(user.id);

      if (idx > -1) {
        order.dishes[dish].splice(idx, 1);
      }

      if (order.dishes[dish].length == 0) {
        delete order.dishes[dish];
      }
    }

    return dish;
  };

  var addNewOrder = function (order, dish, user) {
    clearUserOrder(order, user);
    var sameDish = order.dishes[dish] || [];
    sameDish.push(user.id);
    order.dishes[dish] = sameDish;
    order.users[user.id] = dish;
  };

  robot.hear(/TB/, function (msg) {
    msg.send('Se ordinate ap TB posso aiutarvi io!');
  });

  robot.respond(/per me (.*)/i, function (msg) {
    var dish = msg.match[1].trim();
    var user = msg.message.user;
    var order = getOrder(msg);

    if (dish === 'niente') {
      var oldDish = clearUserOrder(order, user);
      if (oldDish !== undefined)
        msg.reply('Ok, niente più ' + oldDish);
      else
        msg.reply('Ok, fatto!');
    } else {

      addNewOrder(order, dish, user);
      robot.brain.set('order', order);

      msg.reply('ok, ' + dish + ' per ' + user.name);
    }
  });

  robot.respond(/per me niente/i, function (msg) {
    var user = msg.message.user;
    var order = getOrder();
  });

  robot.respond(/ordine/i, function (msg) {
    var reply = ["Ecco l'ordine:"];
    var order = getOrder();

    for (var dish in order.dishes) {
      if (order.dishes.hasOwnProperty(dish)) {
        var userIds = order.dishes[dish];
        var users = userIds.map(function (id) {
          return robot.brain.userForId(id).name;
        });

        var line = [userIds.length, dish, '['];
        line.push(users);
        line.push(']');
        reply.push(line.join(' '));
      }
    }

    msg.reply(reply.join('\n'));
  });
};
