App = {
  web3Provider: null,
  contracts: {},
  currentAccount: null,

  init: async function() {
    return await App.initWeb3();
  },

  initWeb3: async function() {

    if (window.ethereum) {
      App.web3Provider = window.ethereum;
      try {
        await window.ethereum.request({ method: "eth_requestAccounts" });;
      } catch (error) {
        console.error("User denied account access")
      }
    }
    else if (window.web3) {
      App.web3Provider = window.web3.currentProvider;
    }
    else {
      App.web3Provider = new Web3.providers.HttpProvider('http://localhost:7545');
    }
    web3 = new Web3(App.web3Provider);

    currentAccount = web3.currentProvider.selectedAddress

    return App.initContract();
  },

  initContract: function() {

    $.getJSON('RentContract.json', function (data) {
      var RentArtifact = data;
      App.contracts.RentContract = TruffleContract(RentArtifact);

      App.contracts.RentContract.setProvider(App.web3Provider);

      return App.getAllHouses();
    });

    return App.bindEvents();
  },

  bindEvents: function() {
    $(document).on('click', '.add-property', App.handleAdd);
    $(document).on('click', '.btn-rent', App.handleRent);
    $(document).on('click', '.btn-delete', App.handleDelete);
    $(document).on('click', '.btn-change', App.handleChange);
    window.ethereum.on('accountsChanged', function (accounts) {
      location.reload()
    })
  },

  handleChange: function(event) {
    
    event.preventDefault();

    var id = $(event.target).closest('.house-element').data(id);

    if (id == undefined)
    {
      return;
    }

    var houseId = parseInt(id.id);

    var rentContract;

    App.contracts.RentContract.deployed().then(function (instance) {

      rentContract = instance;

      var newPrice = $(event.target).closest('.house-element').find("input[name=rent-price]").val();
      console.log(newPrice);

      if (newPrice <= 0)
      {
        alert("new price must be highet than 0");
      }

      return rentContract.UpdateCost(houseId, newPrice, {from:currentAccount})
    }).then(function (result)
    {
      if(!result)
      {
        alert("Could not delete the house. Check if it is not rented");
      }
      location.reload()
    });    
  },

  handleDelete: function(event) {
    
    event.preventDefault();

    var id = $(event.target).closest('.house-element').data(id);

    if (id == undefined)
    {
      return;
    }

    var houseId = parseInt(id.id);

    var rentContract;

    App.contracts.RentContract.deployed().then(function (instance) {

      rentContract = instance;
      return rentContract.RemoveHouse(houseId, {from:currentAccount})
    }).then(function (result)
    {
      if(!result)
      {
        alert("Could not delete the house. Check if it is not rented");
      }
      location.reload()
    });    
  },

  handleRent: function(event) {
    event.preventDefault();

    var id = $(event.target).closest('.house-element').data(id);

    if (id == undefined)
    {
      return;
    }

    var houseId = parseInt(id.id);

    console.log(houseId);

    var rentContract;

    App.contracts.RentContract.deployed().then(function (instance) {

      rentContract = instance;

      return rentContract.GetRentCost(houseId)
    }).then(function (result)
    {
      var cost = result.c[0]
      return rentContract.RentFrom(houseId, {value: cost * 10**18, from:currentAccount})
    }).then(function()
    {
      location.reload()
    });
    
  },

  getAllHouses: function()
  {
    document.getElementById("currentAddress").textContent = currentAccount;
    App.getAvailableHouses()
    App.getOwnedHouses()
    App.getRentedHouses()
  },

  getAvailableHouses: function () {

    var rentContract;

    App.contracts.RentContract.deployed().then(function (instance) {

      rentContract = instance;

      return rentContract.AvailableHouses({from:currentAccount});           

    }).then(async function (availableHousesIds) {

      var ids = availableHousesIds;
      var houseRow = $('#housesToRentRow');
      var houseTemplate = $('#housesTemplate');

        for (var i = 0; i < ids.length; i++) {

          var id = ids[i].c[0] // ??? i hate javascript        

          await rentContract.GetHouseAddress(id).then(function (result) {     
            houseTemplate.find('.house-location').text(result);
            return rentContract.GetRentCost(id);            
          }).then(function (result) {
            houseTemplate.find('.rent-cost').text(result);
            }).then(function (){
              houseTemplate.find('.btn-rent').show()
              houseTemplate.find('.btn-delete').hide()
              houseTemplate.find('.house-element').attr('data-id', id);
              houseRow.append(houseTemplate.html());       
            })}
    }).catch(function (err) {
      console.log(err.message);
    });
  },

  getOwnedHouses: function()
  {
    var rentContract;

    App.contracts.RentContract.deployed().then(function (instance) {

      rentContract = instance;

      return rentContract.GetOwnedHouses({from:currentAccount});           
    }).then(async function (availableHousesIds) {

      var ids = availableHousesIds;
      var houseRow = $('#housesOwnedRow');
      var houseTemplate = $('#housesTemplate');

        for (var i = 0; i < ids.length; i++) {

          houseTemplate.attr('data-id', id);

          var id = ids[i].c[0] // ??? i hate javascript        
          await rentContract.GetHouseAddress(id).then(function (result) {     
            houseTemplate.find('.house-location').text(result);
            return rentContract.GetRentCost(id);            
          }).then(function (result) {
            houseTemplate.find('.rent-cost').text(result);
            }).then(function (){
              houseTemplate.find('.house-element').attr('data-id', id);
              houseTemplate.find('.btn-delete').show()
              houseTemplate.find('.change-price-form').show()
              houseTemplate.find('.btn-rent').hide()              
              houseRow.append(houseTemplate.html());       
            })}
    }).catch(function (err) {
      console.log(err.message);
    });
  },

  getRentedHouses: function()
  {
    var rentContract;

    App.contracts.RentContract.deployed().then(function (instance) {

      rentContract = instance;

      return rentContract.GetRentedHouses({from:currentAccount});           
    }).then(async function (availableHousesIds) {

      var ids = availableHousesIds;
      var houseRow = $('#housesRentedRow');
      var houseTemplate = $('#housesTemplate');

        for (var i = 0; i < ids.length; i++) {

          var id = ids[i].c[0] // ??? i hate javascript        

          await rentContract.GetHouseAddress(id).then(function (result) {     
            houseTemplate.find('.house-location').text(result);
            return rentContract.GetRentCost(id);            
          }).then(function (result) {
            houseTemplate.find('.rent-cost').text(result);
            }).then(function (){
              houseTemplate.find('.btn-rent').hide();
              houseTemplate.find('.btn-delete').hide();
              houseRow.append(houseTemplate.html());       
            })}
    }).catch(function (err) {
      console.log(err.message);
    });
  },

  handleAdd: function (event) {

    event.preventDefault();

    var address = $('#propertyAddress').val();
    var price = $('#rentPrice').val();

    App.contracts.RentContract.deployed().then(function (instance) {

      var rentContract = instance;
      // Execute adopt as a transaction by sending account
      return rentContract.AddHouse(address, price, { from: currentAccount });
      }).then(function () {
        location.reload()
    }).catch(function (err) {
      console.log(err.message);
    });
  }

};

$(function() {
  $(window).load(function() {
    App.init();
  });
});
