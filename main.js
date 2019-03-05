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

    /*Gets the supplemental information that the adaptor needs to keep track of for 
    a particular tiddler.*/
    getTiddlerInfo (tiddler) {
      return {address: "HoloTW_Address"}
    }
  
    /* Currently calling to get a list of instances and then just checking against an
    expected DNA string. Need to explore how the future pairing up happens - should be 
    checking for a hash. Also I think I might be able to get multiple results with 
    multiple agents. I currently just look for the first valid DNA. */
    getStatus (callback) {
      try {
        console.log('In HoloTW getStatus')

/*         this.makeHolochainCall('admin/agent/list', { }, result => {
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
    
    I might want to have this list in memory and then use a holochain callback to update it
    when needed. I don't think that is implemented yet. Callback is supposed to send 
    (error,<array of tiddler field object> so I need to verify what that is.*/
    getSkinnyTiddlers (callback) {
        console.log('In HoloTW getSkinnyTiddlers')
        
        try {
            this.makeHoloTWCall('query_tiddlers',{ }, result => {
              console.log('Created Tiddler', result);
              //Not sure, but I might need to invoke the callback for each separate result
              callback(null, result);
            })
        }
        catch(e) {
          callback(e)
        }
    }
  
    /* Saving to the Holochain will not guarantee that Title's are unique and this is the 
    rule the TiddlyWiki interface enforces. For this reason if a Tiddler is loaded that
    conflicts with a current name, I think I am going to have to append to it something
    like "_CONFLICT_<agent name>_<datetime>". */
    loadTiddler (title, callback) {
        console.log('In HoloTW loadTiddler')

        //Check for a saved hash in a list of stored tiddlers?
        let holochain_address;
        if (holochain_address != undefined) {
          if (this.b58Check(holochain_address)) {
            // Call getTiddler in Zome
          }
          else
            throw("Address to load Tiddler to Holochain has been corrupted.")
        }
        else {
          // Call addTiddler in Zome
        }
        callback(null)
        return
    }
  
    /* Check if the tiddler already has a hash saved to holochain-address. (Call b58Check 
      to do basic validation of the hash.) Then either save an update to the current entry
      or create a new one.*/
    saveTiddler (tiddler, callback, tiddlerInfo) {

      try {
        console.log('In HoloTW saveTiddler')

        // I think this handles the special case where I don't want to save the user's storyview to the DHT
        if (tiddler.fields.title === '$:/StoryList') {
            this.ls.setItem(tiddler.fields.title, JSON.stringify(tiddler.fields));
            callback(null);
          return
        }
      
        //Drafts get saved too - want to ignore them, but not getting any 2nd save prompts
/*         if ("draft.of" in tiddler.fields)
          return */

        //Check for a saved hash.
        if (tiddler.fields.holochain_address != undefined ) {
          if (this.b58Check(tiddler.fields.holochain_address)) {
            // Call updateTiddler in Zome
          }
          else
            throw("Address to save Tiddler to Holochain has been corrupted.")
        }
        else {
          // Call addTiddler in Zome
            this.makeHoloTWCall('create_tiddler', 
                {title: tiddler.fields.title, text: JSON.stringify(tiddler.fields) }, result => {
              console.log('Created Tiddler', result);
              //Need to add address returned to the tiddler
              callback(null);
                })
        }


      } catch (e) {
        callback(e);
      }

      return
    }
  
    deleteTiddler (title, callback, tiddlerInfo) {
        console.log('In HoloTW deleteTiddler')

        //Check for a saved hash.
        //holochain-address = *get user field from tiddler*;
        if (holochain-address) {
          if (this.b58Check(holochain-address)) {
            // Call deleteTiddler in Zome
          }
          else
            throw("Address to save Tiddler to Holochain has been corrupted.")
        }
        else {
          // I can probably just delete the entry from the TiddlyWiki and notify of error
          throw("Address to delete Tiddler from Holochain is empty.")
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
      this.makeHolochainCall (callString, params, callback);
    }
    
    makeHolochainCall (callString, params, callback) {
      this.holochainConnection.then(({ call }) => {
        // Remove JSON.parse for now. info/instances returned already parsed array of JSON
        call(callString)(params).then((result) => callback(result))
      })
    }
}
  
  if ($tw.browser) {
    exports.adaptorClass = HoloTW
  }