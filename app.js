const express = require("express");
const app = express();
const port = process.env.PORT || 3000;
const CronJob = require("cron").CronJob;
const Vonage = require("@vonage/server-sdk");
const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

const vonage = new Vonage({
	apiKey: process.env.API_KEY,
	apiSecret: process.env.API_SECRET,
});

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

let order = 0;
let currentMsg = 0;

if (process.argv.length === 4) {
	const orderMsgId = process.argv.slice(2);
	order = parseInt(orderMsgId[0]);
	currentMsg = parseInt(orderMsgId[1]);
}

console.log(order);
console.log(currentMsg);

const getApartaments = async () => {
	const { data, error } = await supabase.from("apartament").select().order("apartament", { ascending: true });
	return data;
};

const getMessages = async () => {
	const { data, error } = await supabase.from("messages").select().order("id", { ascending: true });
	return data;
};

const job = new CronJob(
	"0 8 * * 3,0",
	() => {
		const from = "Home";
		const opts = {
			type: "unicode",
		};

		getApartaments().then((res) => {
			const apartamentPhoneNumbers = res[order].phone_numbers["phone_numbers"];
			const apartamentsInfo = res;
			getMessages().then((res) => {
				const messages = res;
				apartamentPhoneNumbers.forEach((number) => {
					console.log("Tira dzivoklis: " + apartamentsInfo[order].apartament);
					console.log(number + " - " + new Date());
					vonage.message.sendSms(from, number, messages[currentMsg].message, opts, (err, responseData) => {
						if (err) {
							console.log(err);
						} else {
							if (responseData.messages[0]["status"] === "0") {
								console.log("Message sent successfully.");
							} else {
								console.log(`Message failed with error: ${responseData.messages[0]["error-text"]}`);
							}
						}
					});
				});
				currentMsg = currentMsg + 1;
				if (currentMsg >= messages.length) {
					currentMsg = 0;
					order = order + 1;
					if (order >= apartamentsInfo.length) {
						order = 0;
					}
				}
			});
		});
	},
	null,
	true,
	"Europe/Riga"
);

app.get("/", (req, res) => {
	res.send(":)");
});

app.listen(port, () => {
	job.start();
	console.log("---");
	console.log(new Date());
	console.log(`App is running on ${port} port!`);
	console.log("---");
});
