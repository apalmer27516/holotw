/*\
title: $:/plugins/abrahampalmer/holotw/main.js
type: application/javascript
module-type: syncadaptor
Working version to save to Holochain - will just hardcode and simplify things for starters
\*/

/* global $tw, fetch */
class HoloTW {
    /* I think I could try to connect to the WS here and use that for the other calls.
    I might still need to structure it to reconnect on error. */
    constructor (options) {

//      try {
        console.log('In HoloTW Constructor');

        const { connect } = require('@holochain/hc-web-client');
        // I thought it might auto-find the dev conductor, but looking for http://localhost:8082/_dna_connections.json
        this.holochainConnection = connect('ws://localhost:3400'); //Hardcode for now
        this.wiki = options.wiki;
  
        //I think just use this special browser localStorage for just the Storylist, but not really sure.
        this.ls = localStorage;

        // Maintain a couple of local indexes to the DHT
        this.skinnyTiddlers = new Map();
        this.tiddlerAddresses = new Map();

/*         this.makeHolochainCall('info/instances', { }, result => {
          console.log('Instances', result);
          result.forEach (function (instance) {
            if (instance.dna === "holotw_app_dna") {
              this.holochainInstance = instance; //Props of agent, dna, and id
            }
          })
        }) */
        this.holochainInstance = {id: "test-instance", dna: "holotw_app_dna", agent: "test_agent1"};
//      } catch (e) {
//        throw(e);
//      }
    }

    //Checked by syncadaptor, but not defined by the interface - force to true to see what happens
    isReady () {
      return true;
    }

    /*Gets the supplemental information that the adaptor needs to keep track of for 
    a particular tiddler. Just looking up in save tiddler for now since not sure how
    the timing works on invoking this.*/
    getTiddlerInfo (tiddler) {
      console.log('In HoloTW getTiddlerInfo:', tiddler.fields);
      return null;
    }
  
    /* Currently calling to get a list of instances and then just checking against an
    expected DNA string. Need to explore how the future pairing up happens - should be 
    checking for a hash. Also I think I might be able to get multiple results with 
    multiple agents. I currently just look for the first valid DNA. */
    getStatus (callback) {
      try {
        console.log('In HoloTW getStatus')

/*         this.makeHolochainCall('admin/agent/list', { }, result => {
          if (!("Ok" in result))
            throw(result);
          console.log('Agent List', result);
          callback(result.Ok, true, "TempUsername", true, false);
        })  */

        if (this.holochainInstance != undefined)
          callback(null, true, this.holochainInstance.agent, true, false);
        else
          callback(null, true, "InstanceNotSet", true, false);
          //throw("Failed to find expected DNA running.");
      }
      catch(e) {
        callback(e)
      } 
    }
  
    /* For this version, I am going to assume that the DHT is set to full replication
    so that it will be for just individual and team use. It should be possible to have
    another method where Holochain links are created for all references to other tiddlers 
    from a given tiddler and to then retrieve those in this list, but that would entail
    some more complicated tiddler parsing on the save with full checking and updating
    of the link references. Also I'm not sure how publishing for someone else to find
    something would work - add a link to a tiddler you know they already have?
    I might have to do something like create a tiddler which I made sure each agent 
    loaded by default which let people add links to it for public content and let people 
    follow it to individuals pages to share content with just them. 
    
    This looks like it gets called periodically so don't need to invoke a Holochain 
    callback to keep decently updated. (
    Callback is supposed to send (error,<array of tiddler field objects minus the text field>)
     - I verified with RemoteStorage. */
    getSkinnyTiddlers (callback) {
        console.log('In HoloTW getSkinnyTiddlers')
        
        try {
          this.makeHoloTWCall('query_tiddlers',{ }, result => {
            if (!("Ok" in result))
              throw(result);
            //Invoked repeatedly so need to clear each time
            this.skinnyTiddlers.clear();
            this.tiddlerAddresses.clear();

            let bCollisionFound = false; //Clear and then check at end to popup warning
            console.log('Queried Tiddlers', result);

            for (let each of result.Ok.Entries) {
              let address = each[0];
              //Don't want to use title like this b/c will have to modify in two places
              //title = JSON.parse(each[1].App[1]).title;
              let tiddler = JSON.parse(JSON.parse(each[1].App[1]).text);
              //Skinny so delete text field
              delete tiddler.text;
              let agent = tiddler.creator;
              
              if (this.skinnyTiddlers.has(tiddler.title)) {
                bCollisionFound = true;
                if (this.holochainInstance.agent != agent) {
                //Modify current tiddler to avoid the collision 
                  if (!("collision" in tiddler.tags)) {
                    tiddler.tags.push("collision");
                  }
                  tiddler.title = tiddler.title + "-" + address;
                }
                else {
                  //Modify saved tiddler to avoid the collision
                  let modified_tiddler = this.skinnyTiddlers.get(tiddler.title);
                  let modified_title = tiddler.title + "-" + address;
                  modified_tiddler.title = modified_title;
                  if (!("collision" in modified_tiddler.tags)) {
                    modified_tiddler.tags.push("collision");
                  }
                  this.skinnyTiddlers.set(modified_title, modified_tiddler);
                  this.tiddlerAddresses.set(modified_title,this.tiddlerAddresses.get(tiddler.title));
                }
              }
              this.tiddlerAddresses.set(tiddler.title,address);
              this.skinnyTiddlers.set(tiddler.title,tiddler);
            }
            if (bCollisionFound)
              $tw.utils.warning("1 or more tiddlers with a duplicate title found. Search on the collision tag to find the duplicates and then either edit the original or delete the original and renname the title of a duplicate.");
              /*
Trigger a popup open or closed. Parameters are in a hashmap:
	title: title of the tiddler where the popup details are stored
	domNode: dom node to which the popup will be positioned (one of domNode or domNodeRect is required)
	domNodeRect: rectangle to which the popup will be positioned
	wiki: wiki
	force: if specified, forces the popup state to true or false (instead of toggling it)
	floating: if true, skips registering the popup, meaning that it will need manually clearing
*/
//              $tw.utils.Popup();
            callback(null, Array.from(this.skinnyTiddlers.values()));
          })

        }
        catch(e) {
          callback(e)
        }
    }
  
    /* Saving to the Holochain will not guarantee that Title's are unique and this is the 
    rule the TiddlyWiki interface enforces. getSkinnyTiddlers takes care of modifying the 
    tiddler fields to handle collisions so here I just need to retrieve the entry from the
    DHT and add the text to the returned tiddler. */
    loadTiddler (title, callback) {
        console.log('In HoloTW loadTiddler:' + title)

        try {
          // Don't save drafts so check to see if the title doesn't exist and complete the callback
          if (this.tiddlerAddresses.has(title)) {
            // Call remove_tiddler in Zome
            this.makeHoloTWCall('get_tiddler', 
            {address: this.tiddlerAddresses.get(title) }, result => {
              if (!("Ok" in result))
                throw(result);
              console.log('Got Tiddler', result);
              let tiddler = this.skinnyTiddlers.get(title);
              tiddler.text = JSON.parse(JSON.parse(result.Ok.App[1]).text).text;
              callback(null,tiddler);
            })
          }
          else {
            throw("Address not found to load Tiddler from Holochain.");
          }
        } catch (e) {
          callback(e);
        }
        return true
      }
  
    /* Check if the tiddler already has a hash saved to holochain-address. 
    Then either save an update to the current entry or create a new one.
    Callback supposed to call err,adaptorInfo,revision, but I'm not sure
    what to send for the latter 2 fields.*/
    saveTiddler (tiddler, callback, tiddlerInfo) {

      try {
        console.log('In HoloTW saveTiddler:', tiddler.fields)

        // I think this handles the special case where I don't want to save the user's storyview to the DHT
        if (tiddler.fields.title === '$:/StoryList') {
          this.ls.setItem(tiddler.fields.title, JSON.stringify(tiddler.fields));
          callback(null);
          return
        }
      
        //Drafts get saved too - want to ignore them, but seems to work if send the callback
        if ("draft.of" in tiddler.fields) {
          callback(null);
          return;
        }

        //Check for a saved address.
        if (this.tiddlerAddresses.has(tiddler.fields.title)) {
          // Call updateTiddler in Zome
          this.makeHoloTWCall('update_tiddler', 
            { address: this.tiddlerAddresses.get(tiddler.fields.title),
              title: tiddler.fields.title, 
              text: JSON.stringify(tiddler.fields) }, result => {
              if (!("Ok" in result))
                throw(result);
              console.log('Updated Tiddler', result);
              this.tiddlerAddresses.set(tiddler.fields.title, result.Ok);
              this.skinnyTiddlers.set(tiddler.fields.title, tiddler.fields);
              callback(null);
            })
        }
        else {
          // Call addTiddler in Zome
          this.makeHoloTWCall('create_tiddler', 
              {title: tiddler.fields.title, text: JSON.stringify(tiddler.fields) }, result => {
            console.log('Created Tiddler', result);
            this.tiddlerAddresses.set(tiddler.fields.title, result.Ok);
            this.skinnyTiddlers.set(tiddler.fields.title, tiddler.fields);
            callback(null);
            })
        }
      } catch (e) {
        callback(e);
      }

      return
    }
  
    deleteTiddler (title, callback, tiddlerInfo) {
      console.log('In HoloTW deleteTiddler:' + title)

      try {
        // Don't save drafts so check to see if the title doesn't exist and complete the callback
        if (!this.tiddlerAddresses.has(title))
          callback(null);
        else {
          // Call remove_tiddler in Zome
          this.makeHoloTWCall('remove_tiddler', 
          {address: this.tiddlerAddresses.get(title) }, result => {
            if (!("Ok" in result))
              throw(result);
            console.log('Removed Tiddler', result);
            this.tiddlerAddresses.delete(title);
            this.skinnyTiddlers.delete(title);
            callback(null);
          })
        }
      } catch (e) {
        callback(e);
      }
      return true
    }

    /* The hash uses b58 encoding and I should do a basic check of what is in the Tiddler
    prior to trying to retrieve it from the Holochain. Check for 46 characters long with 
    everything a member of the following set. */
    b58Check (hash) {
      return ((hash.length == 46) && (46 == hash.match(/[1-9a-km-zA-HJ-NP-Z]/g).length))
    }

    makeHoloTWCall (callString, params, callback) {
      //Prepend instance and zome and then call the general functon
      callString = this.holochainInstance.id + "/holotw/" + callString;
      //Parse the JSON by default, but might need to change
      this.makeHolochainCall (callString, params, callback, true);
    }
    
    makeHolochainCall (callString, params, callback, parse) {
      //Add parameter to drive whether JSON.parse invoked on result - not needed for info/instances
      if (parse) {
        this.holochainConnection.then(({ call }) => {
          call(callString)(params).then((result) => callback(JSON.parse(result)))
        })
      }
      else {
        this.holochainConnection.then(({ call }) => {
          call(callString)(params).then((result) => callback(result))
        })
      }
    }
}
  // Not sure if this code needed - something like it was in the remotestorage plugin, but not sure what it does
  if ($tw.browser) {
    exports.adaptorClass = HoloTW
  }