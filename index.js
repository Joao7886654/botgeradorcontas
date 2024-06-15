const Discord = require("discord.js");
const client = new Discord.Client({ intents: 32767 });
const config = require("./config.json");
const fs = require("fs");
const { createConnection } = require('mysql');

global.conn = createConnection(config.mysql)

client.login(config.token);

client.commands = new Discord.Collection();
client.aliases = new Discord.Collection();
client.categories = fs.readdirSync(`./commands/`);

fs.readdirSync('./commands/').forEach(local => {
    const commands = fs.readdirSync(`./commands/${local}`).filter(arquivo => arquivo.endsWith('.js'))

    for (let file of commands) {
        let command = require(`./commands/${local}/${file}`)

        if (command.name) {
            client.commands.set(command.name, command)
        }
        if (command.aliases && Array.isArray(command.aliases))
            command.aliases.forEach(x => client.aliases.set(x, command.name))
    }
});

client.on("messageCreate", async (message) => {

    let prefix = config.prefix;

    if (message.author.bot) return;
    if (message.channel.type == 'dm') return;

    if (!message.content.toLowerCase().startsWith(prefix.toLowerCase())) return;

    if (message.author.bot) return;
    if (message.channel.type === 'dm') return;

    if (!message.content.startsWith(prefix)) return;
    const args = message.content.slice(prefix.length).trim().split(/ +/g);

    let cmd = args.shift().toLowerCase()
    if (cmd.length === 0) return;
    let command = client.commands.get(cmd)
    if (!command) command = client.commands.get(client.aliases.get(cmd))

    try {
        command.run(client, message, args, command)
    } catch (err) {

        console.error('Erro:' + err);
    }
});

/*============================= | STATUS RICH PRESENCE | =========================================*/

client.on("ready", () => {
    let react = [
        `🤖 Duvidas?`,
        `🤖 !ajuda`,
        `🎫 abrir ticket`,
        `🌐 www.leinadcode.com`
    ],
        fera = 0;
    setInterval(() => client.user.setActivity(`${react[fera++ % react.length]}`, {
        type: "STREAMING",
        url: "https://www.youtube.com/watch?v=6GCHMSA8f_I&t" //mais tipos: WATCHING / LISTENING
    }), 1000 * 10);
    client.user
        .setStatus("streaming");
});

client.on("message", message => {
    if (message.author.bot) return;
    if (message.channel.type == 'react')
        return
    if (message.content == `<@${client.user.id}>` || message.content == `<@!${client.user.id}>`) {
        return message.reply(`🔮 | Olá ${message.author}, veja meus comandos com **${config.prefix}ajuda**!`)
    }
});


client.on("ready", () => {
    console.log("✅ - Estou online")
})

/*============================= | Add product| =========================================*/

client.on('interactionCreate', async interaction => {
    if (interaction.isButton()) {
        if (interaction.customId.startsWith("new_product")) {

            const modal = new Discord.Modal()
                .setCustomId('product_modal')
                .setTitle(`Criar novo produto`)

            const product_name = new Discord.TextInputComponent()
                .setCustomId('product_name')
                .setLabel('Qual é o nome do produto?')
                .setRequired(true)
                .setMaxLength(150)
                .setStyle('SHORT')
                .setPlaceholder('Exemplo');

            const product_body = new Discord.TextInputComponent()
                .setCustomId('product_body')
                .setLabel('Qual é a descrição do produto?')
                .setRequired(true)
                .setMaxLength(255)
                .setStyle('PARAGRAPH')
                .setPlaceholder('O melhor produto!')

            const product_value = new Discord.TextInputComponent()
                .setCustomId('product_value')
                .setLabel('Qual é o valor do produto em reais e centavos')
                .setRequired(true)
                .setMaxLength(50)
                .setStyle('SHORT')
                .setPlaceholder('15,00');

            const product_category_id = new Discord.SelectMenuInteraction()
                .setCustomId('product_category_id')
                .setLabel('Qual é a categoria do produto?')
                .req

            modal.addComponents(
                new Discord.MessageActionRow().addComponents(product_name),
                new Discord.MessageActionRow().addComponents(product_body),
                new Discord.MessageActionRow().addComponents(product_value),
            );

            return interaction.showModal(modal);
        }
    }

    if (interaction.isModalSubmit()) {
        if (interaction.customId === 'product_modal') {
            const product_name = interaction.fields.getTextInputValue('product_name');
            const product_value = interaction.fields.getTextInputValue('product_value');

            conn.query(`INSERT INTO products (server_id, name, value, quantity) VALUES ('${interaction.guildId}','${product_name}','${Number(product_value.replace(',', '.').replace(/[^\d\.]+/g, ''))}','1')`);

            return interaction.reply({ content: 'Produto criado com sucesso!', ephemeral: true })
        }
    }
});