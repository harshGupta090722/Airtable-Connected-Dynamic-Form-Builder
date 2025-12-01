First of all set all the variables needed for the app to work.
I have mentioned them all in .env 

Then run backend 
npm run dev
 then frontend 
 npm run dev 

 IF you using local then you would have to use ngrok

 ngrok http 4002 
 4002 -backend port

 Then we have entered login page-This is the main landing page of our app 
  {

Here I will add screesnhrot of the page 

  }

  Then we hit sign in with Airtable -
  We are directed to Airtable sign in page ,
  Where OAth and exchagne of token happens -referesh and access token 
  {
//Here I will attach the login with google page 

  }


Now the user will be direted to dashboard page -
where all prefvious created forms are fetched ,user can anytime share them,using share id


{
    Add ss of Dashbaord 
}


Now user clicks-Create New Form 

All the bases 
then the table of that useer form it's Airtable account will be fetched in our third pary app 

Then user can select the fields which he wants to add in his dynmic route with conditonal logic 

{
    HERE I will add the ss of form creation page 
}

Then the useer is directd to the dashbaord 
Then he shares link 

Now the form fillers fill the exporm -and conditonal logic is used and dynamic form is created is automatically 

As they submit the response the and redirects to thankyou page 

In the mean time ,the data is updated both in airtable app and our mongo db with all the ncesssary dertails 

{

    Here I will show the ss of the airtable app with the inputed field 
}