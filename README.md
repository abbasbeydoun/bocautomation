# bocautomation
The idea was to automate the opt-out process from big companies that hoard user data and sell them to companies for marketing purposes.

Some "Identity solution" websites like Acxiom and others sell peoples data to anyone willing to pay. You can opt out of these services to protect your online privacy. 

The idea of this project was to opt-out of major services like this

We got to the point where we fully automated the opt-out process for a major data company using some sample JSON data as input including going to the page, filling the requires forms, logging in to email and clicking on sent link for verification, and solving capchas. The biggest hurdle/achievment was bypassing the captchas with the DeathByCaptcha API.

For some captchas, the DBC API sends them to actual humans who will solve them and send the response token back to you so you can use it appropriately, esentially "automating humans".

If someone is determined enough, they can always write code to bypass captchas.

You can find a working example of how to bypass a captcha with the DBC API in the source code as well as how to use googleapis and OAuth2client to log in to gmail and do some basic things.



