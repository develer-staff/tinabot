// Description:
//   Script per fare la lista dei piatti da ordinare al TuttoBene
//
// Commands:
//   hubot menu [<menu>] - Mostra il menù. Se viene indicato anche <menu>, ne salva uno nuovo
//   hubot ordine - Lista dei piatti ordinati oggi
//   hubot per me <ordine> [+ <ordine>] - Aggiunge <ordine> all'ordine dell'utente. Con "+ <ordine>" inserisce 2 ordini.
//   hubot per me niente - Cancella il proprio ordine
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
    var dishes = order.users[user.id];

    for (var id in dishes) {
      var dish = dishes[id];
      if (dish !== undefined && order.dishes[dish] !== undefined) {
        var idx = order.dishes[dish].indexOf(user.id);

        if (idx > -1) {
          order.dishes[dish].splice(idx, 1);
        }

        if (order.dishes[dish].length == 0) {
          delete order.dishes[dish];
        }
      }
    }

    return dishes;
  };

  var addNewOrder = function (order, dishes, user) {
    clearUserOrder(order, user);
    for (var id in dishes) {
      var dish = dishes[id];
      var sameDish = order.dishes[dish] || [];
      sameDish.push(user.id);
      order.dishes[dish] = sameDish;
    }

    order.users[user.id] = dishes;
  };

  robot.hear(/TB/, function (msg) {
    msg.send('Se ordinate al TuttoBene posso aiutarvi io!');
  });

  robot.hear(/TuttoBene/i, function (msg) {
    msg.send('Se ordinate al TuttoBene posso aiutarvi io!');
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

      var dishes = dish.split('+');
      dishes = dishes.map(function (s) { return s.trim(); });

      addNewOrder(order, dishes, user);
      robot.brain.set('order', order);

      msg.reply('ok, ' + dishes.join(' e ') + ' per ' + user.name);
    }
  });

  robot.respond(/ordine/i, function (msg) {
    var reply = ["Ecco l'ordine:"];
    var order = getOrder();

    for (var dish in order.dishes) {
      if (order.dishes.hasOwnProperty(dish)) {
        var userIds = order.dishes[dish];
        var line = [userIds.length, dish];
        var showNames = true;
        if (showNames) {
          var users = userIds.map(function (id) {
            return robot.brain.userForId(id).name;
          });

          line.push('[');
          line.push(users);
          line.push(']');
        }

        reply.push(line.join(' '));
      }
    }

    msg.reply(reply.join('\n'));
  });

  robot.respond(/menu([\s\S]*)?/i, function (msg) {
    var menu = (msg.match[1] || '').trim();
    if (menu === '') {
      menu = robot.brain.get('menu') || '';
      if (menu === '') {
        msg.reply('Non c\'è nessun menu impostato!');
      } else {
        msg.reply('Il menu è:\n' + menu);
      }
    } else {
      robot.brain.set('menu', menu);
      msg.reply('ok, il menu è ' + menu);
    }
  });

  robot.respond(/user debug (.*)/i, function (msg) {
    msg.reply(msg.message.user);
  });
};
