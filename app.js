const express = require("express");
const app = express();
const port = 3000;
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

const getApartaments = async () => {
	const { data, error } = await supabase.from("apartament").select();
	return data;
};

const job = new CronJob(
	"*/1 * * * *",
	() => {
		const from = "Home";
		const text = "Ir pienākusi Jūsu kārta tīrīt kāpņu telpu! :)";
		const opts = {
			type: "unicode",
		};

		getApartaments().then((res) => {
			const apartamentPhoneNumbers = res[order].phone_numbers["phone_numbers"];

			apartamentPhoneNumbers.forEach((number) => {
				console.log("Tira dzivoklis: " + res[order].apartament);
				console.log(number + " - " + new Date());
				vonage.message.sendSms(from, number, text, opts, (err, responseData) => {
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
			order = order + 1;
			if (order === res.length) {
				order = 0;
			}
		});
	},
	null,
	true,
	"Europe/Riga"
);

app.listen(port, () => {
	job.start();
	console.log("App is running!");
});
