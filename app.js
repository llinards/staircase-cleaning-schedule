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

const getApartaments = async () => {
	const { data, error } = await supabase.from("apartament").select().order("apartament", { ascending: true });
	return data;
};

const job = new CronJob(
	"0 6 * * MON",
	() => {
		const from = "Home";
		const textApartamentFour = "Sveika, Liene! Ir pienākusi Tava kārta tīrīt kāpņu telpu!";
		const textApartamentFive = "Sveiciens, Simona un Linard! Ir pienākusi Jūsu kārta tīrīt kāpņu telpu!";
		const textApartamentSix = "Sveiciens, Krista un Krister! Ir pienākusi Jūsu kārta tīrīt kāpņu telpu!";
		const opts = {
			type: "unicode",
		};

		getApartaments().then((res) => {
			const apartamentPhoneNumbers = res[order].phone_numbers["phone_numbers"];
			let text;
			apartamentPhoneNumbers.forEach((number) => {
				console.log("Tira dzivoklis: " + res[order].apartament);
				console.log(number + " - " + new Date());
				if (res[order].apartament === 4) {
					text = textApartamentFour;
				} else if (res[order].apartament === 5) {
					text = textApartamentFive;
				} else if (res[order].apartament === 6) {
					text = textApartamentSix;
				}
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
