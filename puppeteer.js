const puppeteer = require('puppeteer');

//Returns if element is visible || after 800ms - false
const isElementVisible = async (page, domElement) => {             
  let visible = true;
  await page
    .waitForSelector(domElement, { visible: true, timeout: 800 })
    .catch(() => {
      visible = false;
    });
  return visible;
};

//Load all usernames under post and check them for username if only one username matches returns true else false
async function checkUserName (browser, link, username) 
{
  const loadMoreButton = 'ul li button';
  
  const page = await browser.newPage();
  page.setViewport({height: 1080, width: 1920});

  await page.goto(link);

  let loadMoreVisible = await isElementVisible(page, loadMoreButton);  //https://bit.ly/2zkItLp https://bit.ly/2KgAbZs
  while (loadMoreVisible) {                                            //Clicks on load more button while it exists
    await page
      .click(loadMoreButton)
      .catch(() => {});
    loadMoreVisible = await isElementVisible(page, loadMoreButton);
  }

  let usernames = await page.evaluate(() => {                         //Returns array of usernames
    const arr = [];
    const elements = document.querySelectorAll('h3');
    for(let i = 0; i < elements.length; i++)
      arr.push(elements[i].firstChild.innerText);
    return arr;
  })
  console.log(username);
  for(let i = 0; i < usernames.length; i++)
  {
    if((usernames[i].toUpperCase()) === (username.toUpperCase()))
    {
      await page.close();
      return true;
    }
  }
  
  await page.close();
  return false;
}

//Returns array which is true or false for each link from array so we can say if there is users username under post or not
async function getCommentedLinks(browser, links)
{
  let result = [];
  /*const browser = await puppeteer.launch({
    headless: false,
    args:[
      '--window-size=1920,1080'
    ]
  });*/

  for(let i = 0; i < links.length; i++)
    result.push(await checkUserName(browser, links[i], username));

  //await browser.close();
  return result;
}

//Checks if link for photo or account is valid and not closed 
//returns '-1' for invalid link, '0' for closed account and '1' if everything is ok
async function checkValidLink(browser,link) 
{
  /*const browser = await puppeteer.launch({
    headless: false,
    args:[
      '--window-size=1920,1080'
    ]
  });*/

  const page = await browser.newPage();
  page.setViewport({height: 1080, width: 1920});

  await page.goto(link);

  let result = await page.evaluate(() =>{
    const errorPage = '.error-container';
    if(document.querySelector(errorPage) != null)
      return -1;
    else if(document.querySelector('h2') != null && document.querySelector('h2 a') == null)
      return 0;
    else 
      return 1;
  })
  
  await page.close();
 // await browser.close();
  return result;
}


const links = [
  'https://www.instagram.com/p/Bv91-MMB9D8/'
];
const username = 'retnif';


//TODO:
/*
Add telegram bot and database
*/

//Our main function 
(async () => 
{
  const browser = await puppeteer.launch({
    headless: false,
    args:[
      '--window-size=1920,1080'
    ]
  });

  let valid = await checkValidLink(browser, 'https://www.instagram.com/apple/');
  console.log(valid);

  let finalArr = await getCommentedLinks(browser, links);
  console.log(finalArr);

  await browser.close();
})();