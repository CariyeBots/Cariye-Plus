const { MessageEmbed } = require('discord.js');
const Kitsu = require('kitsu.js');
const kitsu = new Kitsu();
const { Command, CommandType, Argument, ArgumentType } = require("gcommands")

new Command({
  name: "animesearch",
  description: "Search for anime",
	nameLocalizations: {
    "tr": "animeara"
  },
  descriptionLocalizations: {
    "tr": "anime ara"
  },
  type: [ CommandType.SLASH ],
  arguments: [
    new Argument({
      name: "anime",
      description: "anime",
			nameLocalizations: {
        "tr": "anime"
      },
      descriptionLocalizations: {
        "tr": "anime ismi"
      },
      type: ArgumentType.STRING,
      required: true,
    }),
  ],
  async run({ reply, arguments }) {
    let search = arguments.getString('anime')

    kitsu.searchAnime(search).then(result => {
      if (!result.length) {
        return reply({
          content: `No results found for **${search}**!`,
          ephemeral: true
        });
      }

      let anime = result[0]

      let embed = new MessageEmbed()
        .setColor('RANDOM')
        .setAuthor({
          name: `${anime.titles.english ? anime.titles.english : search} | ${anime.showType}`,
          iconURL: anime.posterImage.original
        })
        .setDescription(anime.synopsis.replace(/<[^>]*>/g, '').split('\n')[0])
        .addField('❯\u2000\Information', `•\u2000\**Japanese Name:** ${anime.titles.romaji}\n\•\u2000\**Age Rating:** ${anime.ageRating}\n\•\u2000\**NSFW:** ${anime.nsfw ? 'Yes' : 'No'}`, true)
        .addField('❯\u2000\Stats', `•\u2000\**Average Rating:** ${anime.averageRating}\n\•\u2000\**Rating Rank:** ${anime.ratingRank}\n\•\u2000\**Popularity Rank:** ${anime.popularityRank}`, true)
        .addField('❯\u2000\Status', `•\u2000\**Episodes:** ${anime.episodeCount ? anime.episodeCount : 'N/A'}\n\•\u2000\**Start Date:** ${anime.startDate}\n\•\u2000\**End Date:** ${anime.endDate ? anime.endDate : "Still airing"}`, true)
        .setImage(anime.posterImage.original);

      return reply({ embeds: [embed] });

    }).catch(err => {
      console.log(err)
      return reply({
        content: `No results found for **${search}**!`,
        ephemeral: true
      });
    });
  }
})