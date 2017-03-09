// Description:
//   Script per fare la lista dei piatti da ordinare al TuttoBene
//
// Commands:
//   hubot menu [<menu>] - Mostra il menù. Se viene indicato anche <menu>, ne salva uno nuovo
//   hubot ordine - Lista dei piatti ordinati oggi
//   hubot email - Lista dei piatti ordinati oggi, formattata per inviare direttamente l'email
//   hubot cancella ordine - Reinizializza l'ordine corrente
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
      users: {},
      idToName: {},
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
    order.idToName[user.id] = user.name;

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

  var countMatches = function (str1, str2) {
    var s1 = str1.split(' ');
    var s2 = str2.split(' ');

    s1 = s1.map(function (s) { return s.trim().toLowerCase(); });
    s2 = s2.map(function (s) { return s.trim().toLowerCase(); });

    var match = 0;

    for (i = 0; i < s1.length; i++) {
      for (j = 0; j < s2.length; j++) {
        if (s1[i] === s2[j])
          match++;
      }
    }

    return match;
  };

  var findDish = function (menu, dish) {
    var maxmatch = 0;
    var maxmatch_unique = false;
    var maxmatch_id = -1;

    for (var i = 0; i < menu.length; i++) {
      var matches = countMatches(menu[i], dish);
      if (matches > maxmatch) {
        maxmatch_id = i;
        maxmatch_unique = true;
        maxmatch = matches;
      }
      else if (matches === maxmatch) {
        maxmatch_unique = false;
      }
    }

    if (maxmatch_unique === true) {
      dish = menu[maxmatch_id];
    }
    else if (maxmatch > 0) {
      dish = null;
    }
    return dish;
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

      // prova a fare un match fuzzy nel menu
      for (var d in dishes) {
        var newdish = findDish(robot.brain.get('menu').split('\n'), dishes[d])
        if (newdish === null) {
          msg.reply('non capisco, "' + dish +'" è ambiguo.');
          return;
        }
        else
          dishes[d] = newdish;
      }

      addNewOrder(order, dishes, user);
      robot.brain.set('order', order);

      msg.reply('ok, ' + dishes.join(' e ') + ' per ' + user.name);
    }
  });

  robot.respond(/cancella ordine/i, function (msg) {
    robot.brain.set('order', initializeEmptyOrder());
    msg.reply('Ordine cancellato');
  });

  robot.respond(/ordine/i, function (msg) {
    var reply = ["Ecco l'ordine:"];
    var order = getOrder();

    for (var dish in order.dishes) {
      if (order.dishes.hasOwnProperty(dish)) {
        var userIds = order.dishes[dish];
        var line = [userIds.length, dish];

        var users = userIds.map(function (id) {
          var name = order.idToName[id];
          if (typeof name !== 'undefined' && name !== '') {
            return name;
          }
          return robot.brain.userForId(id).name;
        });

        line.push('[');
        line.push(users);
        line.push(']');

        reply.push(line.join(' '));
      }
    }

    msg.reply(reply.join('\n'));
  });

  robot.respond(/email/i, function (msg) {
    var order = getOrder();
    var order_date = new Date(order.timestamp);
    var formatted_date = order_date.getUTCDate() + '/' + (order_date.getUTCMonth() + 1);
    var reply = ["Ordine Develer del giorno " + formatted_date];

    for (var dish in order.dishes) {
      if (order.dishes.hasOwnProperty(dish)) {
        var userIds = order.dishes[dish];
        var line = [userIds.length, dish];
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
};
