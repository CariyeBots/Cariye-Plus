const { Command, CommandType, Argument, ArgumentType } = require('gcommands');
const { MessageEmbed, MessageActionRow, MessageButton } = require("discord.js");

const settings = {
  width: 15,
  height: 10,
  Food: "🐀",
  background: "⬛",
  Snake: "🟢",
  emojis: {
    left: "⬅️",
    right: "➡️",
    up: "⬆️",
    down: "⬇️",
  },
};

new Command({
  name: "snake",
  description: "snake game",
  type: [CommandType.SLASH],
	arguments: [
		new Argument({
			name: "leaderboard",
			description: "check global leaderboard",
			type: ArgumentType.SUB_COMMAND
		}),
		new Argument({
			name: "start",
			description: "start snake game",
			type: ArgumentType.SUB_COMMAND
		}),
		new Argument({
			name: "stop",
			description: "stop your running game",
			type: ArgumentType.SUB_COMMAND
		})
  ],
  async run({ arguments, reply, interaction, client }) {
    const sub = arguments.getSubcommand();
		const db = client.db;

		if (sub === 'leaderboard') {
			let string = db
      .sort((a, b) => b.Score - a.Score)
            // .filter((t, i) => i < 10)
      .map((value) => {
        let user = client.users.cache.get(value.UserID);
        return ` **${user?.tag}** Score: \`${value.Score}\` Level: \`${value.Level}\``;
      })
      .join("\n\n");
      reply({ content: `${string.substring(0, 1000)}` || `No One Playing Now` });
		}

		if (sub === 'start') {
			if (db.has(`snake-${interaction.user.id}`)) {
        return reply({ content: `Your Game is already Running Stop Fist`, ephemeral: true });
      }
      ensure(db, `snake-${interaction.user.id}`, {
        UserID: interaction.user.id,
        GameScreen: [],
        FoodPosition: { x: 1, y: 1 },
        SnakePosition: [{ x: 5, y: 5 }],
        SnakeLength: 1,
        Score: 0,
        Level: 0,
      });
      let data = db.get(`snake-${interaction.user.id}`);
      // making big food
      for (let y = 0; y < settings.height; y++) {
      	for (let x = 0; x < settings.width; x++) {
          data.GameScreen[y * settings.width + x] = settings.background;
          db.set(`snake-${interaction.user.id}`, data);
        }
      }

      function GameScreen() {
      	let str = "";
        for (let y = 0; y < settings.height; y++) {
          for (let x = 0; x < settings.width; x++) {
            if (x == data.FoodPosition.x && y == data.FoodPosition.y) {
              str += settings.Food;
              continue;
            }

            let flag = true;
            for (let s = 0; s < data.SnakePosition.length; s++) {
              if (x == data.SnakePosition[s].x && y == data.SnakePosition[s].y ) {
                str += settings.Snake;
                flag = false;
              }
            }
            if (flag) str += data.GameScreen[y * settings.width + x];
            db.set(`snake-${interaction.user.id}`, data);
          }
          str += "\n";
        }
        return str;
      }

      function isSnakeLocation(position) {
        return data.SnakePosition.find((sPos) => sPos.x == position.x && sPos.y == position.y);
      }

      function newFoodLocation() {
        let newFoodPos = { x: 0, y: 0 };

        if (isSnakeLocation(newFoodPos)) newFoodPos = {
          x: parseInt(Math.random() * settings.width),
          y: parseInt(Math.random() * settings.height),
        };

        data.FoodPosition.x = newFoodPos.x;
        data.FoodPosition.y = newFoodPos.y;
        db.set(`snake-${interaction.user.id}`, data);
      }

      function getData() {
        let row = new MessageActionRow().addComponents([
          new MessageButton()
            .setStyle("SECONDARY")
            .setLabel(`\u200b`)
            .setCustomId("disabled1")
            .setDisabled(true),
          new MessageButton()
            .setStyle("SECONDARY")
            .setCustomId("up")
            .setEmoji(settings.emojis.up),
          new MessageButton()
            .setStyle("SECONDARY")
            .setLabel(`\u200b`)
            .setCustomId("disabled4")
            .setDisabled(true),
        ]);

        let row2 = new MessageActionRow().addComponents([
          new MessageButton()
            .setStyle("SECONDARY")
            .setCustomId("left")
            .setEmoji(settings.emojis.left),
          new MessageButton()
            .setStyle("PRIMARY")
            .setCustomId("stop")
            .setEmoji("❌"),
          new MessageButton()
            .setStyle("SECONDARY")
            .setCustomId("right")
            .setEmoji(settings.emojis.right),
        ]);

        let row3 = new MessageActionRow().addComponents([
          new MessageButton()
            .setStyle("SECONDARY")
            .setLabel(`\u200b`)
            .setCustomId("disabled6")
            .setDisabled(true),
          new MessageButton()
            .setStyle("SECONDARY")
            .setCustomId("down")
            .setEmoji(settings.emojis.down),
          new MessageButton()
            .setStyle("SECONDARY")
            .setLabel(`\u200b`)
            .setCustomId("disabled9")
            .setDisabled(true)
        ]);

        let embed = new MessageEmbed()
          .setColor("RANDOM")
          .setTitle(`Score: ${data.Score} \n Level: ${data.Level} `)
          .setDescription(GameScreen().substring(0, 4090))
          .setFooter({
            text: interaction.user.tag,
            iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
          });

        return {
          content: `** Snake Game **`,
          embeds: [embed],
          components: [row, row2, row3],
          ephemeral: true,
          fetchReply: true,
        };
      }
      let GameMsg = await reply(getData());
      let filter = (i) => i.user.id === interaction.user.id;
      let collector = await GameMsg.createMessageComponentCollector({
        filter: filter,
      });

      collector.on("collect", async (interaction) => {
        if (interaction.isButton()) {
          await interaction.deferUpdate().catch((e) => null);
          const { customId } = interaction;
          const SHead = data.SnakePosition[0];
          const nextPos = { x: SHead.x, y: SHead.y };

          switch (customId) {
            case "up":
              {
                let nextY = SHead.y - 1;
                if (nextY < 0) nextY = settings.height - 1;
                nextPos.y = nextY;
              }
            break;
            case "down":
              {
                let nextY = SHead.y + 1;
                if (nextY >= settings.height) nextY = 0;
                nextPos.y = nextY;
              }
            break;
            case "left":
              {
                let nextX = SHead.x - 1;
                if (nextX < 0) nextX = settings.width - 1;
                nextPos.x = nextX;
              }
            break;
            case "right":
              {
                let nextX = SHead.x + 1;
                if (nextX >= settings.width) nextX = 0;
                nextPos.x = nextX;
              }
            break;
            case "stop":
              {
                gameOver();
              }
            break;
            default:
            break;
          }

          if (isSnakeLocation(nextPos)) {
            gameOver();
          } else {
            data.SnakePosition.unshift(nextPos);
            if (data.SnakePosition.length > data.SnakeLength) data.SnakePosition.pop();
            db.set(`snake-${interaction.user.id}`, data);
            SnakeRunner();
          }

          function SnakeRunner() {
            if (data.FoodPosition.x == data.SnakePosition[0].x && data.FoodPosition.y == data.SnakePosition[0].y) {
              let GameLevel = Math.floor(0.5 * Math.sqrt(data.Score));
              data.Score += 1;
              data.SnakeLength++;
              data.Level = GameLevel;
              db.set(`snake-${interaction.user.id}`, data);
              newFoodLocation();
            }
            interaction.editReply(getData());
          }
        }
      });

      collector.on("end", async (c, msg) => {
        gameOver();
      });

      function gameOver() {
        interaction.editReply({
          embeds: [
            new MessageEmbed()
              .setColor("RANDOM")
              .setAuthor({
                name: `Snake Game :: ${interaction.user.username}`,
                iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
              })
              .setDescription(`⚠️ Game Over - \`${interaction.user.tag}\` ⚠️`)
              .setFooter({
                text: `Total Rat Killed :: ${data.Score}`,
                iconURL: client.user.displayAvatarURL({ dynamic: true })
              }),
          ],
          components: [],
        })
        .catch((e) => null);
        db.delete(`snake-${interaction.user.id}`);
      }
      function ensure(db, key, data) {
        if (db) {
          const dd = db.has(key);
          if (!dd) {
            db.set(key, data);
            return true;
          } else {
            for (const [Okey, value] of Object.entries(data)) {
              const Ddd = db.has(`${key}.${Okey}`);
              if (!Ddd) {
                db.set(`${key}.${Okey}`, value);
              } else;
            }
            return true;
          }
        } else {
          return true;
        }
      }
    }

		if (sub === 'stop') {
			if (!db.has(`snake-${interaction.user.id}`)) {
        return send({ content: `You are not playing game`, ephemeral: true });
      } else {
      	db.delete(`snake-${interaction.user.id}`);
        return reply({ content: "Your Game Stoped Now Delete Your Ephemeral Game Message to Start New Game", ephemeral: true });
      }
		}
  }
})
