const axios = require('axios');
const cheerio = require('cheerio');
const { response } = require('express');

const baseUrl = "https://www.yelp.com";

// Review variables
const numberOfReviewsPerPage = 10;

const bizInfoSelector = '> div.review-topbar > div > div.media-story '
const addressSelector = `${bizInfoSelector}> address `;
const bizSelector = `${bizInfoSelector}> div.media-title.clearfix > a `;

// User profile variables

const userProfileSelector = `#wrap > div.main-content-wrap.main-content-wrap--full > \
    div.top-shelf.top-shelf-grey > div > div.user-profile_container > \
    div.user-profile_content-wrapper.arrange.arrange--bottom.arrange--30 > \
    div.user-profile_info.arrange_unit `
const userNameSelector = `${userProfileSelector}> h1`;
const userHometownSelector = `${userProfileSelector}> h3`;


function getUserReviewUrl(useId, pageNumber) {
    return `${baseUrl}/user_details_reviews_self?rec_pagestart=${pageNumber*numberOfReviewsPerPage}&userid=${useId}`;
}

function getUserProfileUrl(userId) {
    return `${baseUrl}/user_details?userid=${userId}`;
}

function getReviewSelector(i) {
    return `#super-container > div > div.column.column-beta > div > ul > li:nth-child(${i}) > div `
}

function getReviewLink(reviewId, bizUrl) {
    let result = `${bizUrl}?hrid=${reviewId}`;
    return result;
}

async function scrapeReviewPage(url) {

    let reviews = [];
    await axios(url).then(response => {
        const html_data = response.data;
        const $ = cheerio.load(html_data);
        const numberOfReviews = $('.review').length;
        for (let reviewIndex = 1; reviewIndex <= numberOfReviews; reviewIndex++) {

            const reviewSelector = getReviewSelector(reviewIndex);
            const fullBizSelector = reviewSelector+bizSelector;
            const bizNameSelector = `${fullBizSelector}> span`;
            const fullAddressSelector = reviewSelector+addressSelector;

            const reviewId = $(reviewSelector).attr('data-review-id');
            const bizUrl = baseUrl+$(fullBizSelector).attr('href');

            const reviewDetails = {
                'ReviewId': reviewId,
                'BizName': $(bizNameSelector).text(),
                'Address': $(fullAddressSelector).html()
                    .replace('/\\n/gi', '').trim().replace('<br>', ', '),
                'ReviewLink': `${getReviewLink(reviewId, bizUrl)}`
            };

            reviews.push(reviewDetails);
        }
    }).catch(error => {
        console.error(error.toString());
        throw new TypeError('User Not Found');
    });

    return reviews;
}

async function reviewScraper(userId, reviewNumberLimit) {

    const userReviewUrl = getUserReviewUrl(userId);
    let reviews = [];
    // let numberOfReviewPages = 0;
    let numberOfReviewPages = reviewNumberLimit / 10;

    await axios(userReviewUrl)
        .then(response => {
            const html_data = response.data;
            const $ = cheerio.load(html_data);
            // numberOfReviewPages = $('.page-option').length;
        }).catch(error => {
            console.error(error.toString());
            throw new TypeError('User Not Found');
        });

    for (let pageIndex = 0; pageIndex < numberOfReviewPages; pageIndex++) {
        let r = await scrapeReviewPage(getUserReviewUrl(userId, pageIndex));
        reviews.push(...r);
    }

    return reviews;
}

exports.GetReviews = async (req, res) => {
    try {
        const reviews = await reviewScraper(req.params.userId, req.params.reviewNumberLimit);
        return res.status(200).json({
            success: true,
            count: reviews.length,
            data: reviews,
        });
    } catch (err) {
        if (err instanceof TypeError) {
            return res.status(400).json({
                error: err.message,
            });
        } else {
            return res.status(500).json({
                error: err.message,
            });
        }
    }
};

async function userScraper(userId) {

    const userUrl = getUserProfileUrl(userId);
    let userDetails;

    await axios(userUrl)
        .then(response => {
            const html_data = response.data;
            const $ = cheerio.load(html_data);
            userDetails = {
                'Name': $(userNameSelector).text(),
                'Hometown': $(userHometownSelector).text(),
                'NumberOfReviews': $('.review-count > strong').text(),
                'AvatarImage': $('.user-profile_avatar img').attr('src')
            };
        }).catch(error => {
            console.error(error.toString());
            throw new TypeError('User Not Found');
        });

    return userDetails;
}

exports.GetUser = async (req, res) => {
    try {
        const user = await userScraper(req.params.userId);
        return res.status(200).json({
            success: true,
            data: user,
        });
    } catch (err) {
        if (err instanceof TypeError) {
            return res.status(400).json({
                error: err.message,
            });
        } else {
            return res.status(500).json({
                error: err.message,
            });
        }
    }
};