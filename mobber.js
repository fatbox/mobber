//
// mobber
// The FatBox Browsermob Simulator
// Copyright (c) 2012 - FatBox Inc.
//
// This exposes all the common logic for interacting with browsermob
//
// It's basic use is to wrap transactions & steps:
// Simulator.transaction(function(sim) {
//      // set the user agent
//      sim.set_user_agent("...");
//
//      // do a step
//      sim.step('my_step', function() {
//          // ... do your stuff ...
//          sim.log("Log a message");
//
//          // simulate user think time with a MAX of 10 seconds
//          // it will randomly alter the agressiveness of your
//          // users to provide a more even mix of load
//          sim.think(10);
//      });
// });
//

var Simulator = (function() {
    // this controls the agressivness of the user
    var think_time_percentage = 40 + (Math.random() * 60);

    // this is our selenium driver
    var driver = browserMob.openBrowserWebDriver("FF"); 

    return {
        debug: false,
        skip_think_on_debug: true,
        driver: driver,

        whitelist: function(sites) {
            var c = browserMob.getActiveHttpClient();
            return c.whitelistRequests(sites, 200);
        },
        set_auth: function(domain, username, password) {
            var c = browserMob.getActiveHttpClient();
            return c.autoBasicAuthorization(domain, username, password);
        },
        set_user_agent: function(agent) {
            var c = browserMob.getActiveHttpClient();
            return c.addRequestInterceptor(function(req) {
                req.removeHeaders("User-Agent");
                req.addHeader("User-Agent", agent);
            });
        },
        set_form_element: function(id, value) {
            this.driver.executeScript("document.getElementById('"+id+"').value = '"+value+"';");
        },
        send_keys: function(id, value) {
            this.driver.findElement(By.id(id)).sendKeys(value);
        },
        think: function(max_time, full) {
            if (full) {
                var think_time = max_time;
            } else {
                var think_time = this.random_range(1, max_time) * (think_time_percentage/100);
                var min_time = max_time * .25;
                think_time = this.round(think_time, 2);
                if (min_time < 1) {
                    min_time = 1;
                }
                if (think_time < min_time) {
                    think_time = min_time;
                }
            }
            if ((this.debug == true) && (this.skip_think_on_debug == true)) {
                this.log("Would normally think for "+think_time+" seconds here, but we're in debug mode");
            } else {
                this.log("Thinking for "+think_time+" seconds");
                browserMob.pause(think_time*1000);
            }
        },
        random_wait: function(from, to) {
            // random wait
            var t = this.random_range(from, to);
            // t = this.round(t, 2);
            this.log("Waiting for "+t+" seconds");
            browserMob.pause(t*1000);
        },
        step: function(name, callback) {
            this.log("========================");
            this.log("Beginning step: "+name);
            browserMob.beginStep(name);
            callback();
            browserMob.endStep();
            this.log("Ending step: "+name);
            this.log("========================");
        },
        transaction: function(callback) {
            this.log("------------------------");
            this.log("Transaction start");
            browserMob.beginTransaction();
            callback(this);
            browserMob.endTransaction();
            this.log("------------------------");
        },
        random_range: function(from, to) {
            return Math.floor(Math.random() * (to - from + 1) + from);
        },
        round: function(n, precision) {
            return Math.round(n*Math.pow(10,precision))/Math.pow(10,precision);
        },
        log: function(message) {
            browserMob.log(message);
        },
    };
}());
