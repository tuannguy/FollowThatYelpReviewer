const axios = require('axios');
const cheerio = require('cheerio');
const { response } = require('express');

const baseUrl = "https://www.yelp.com";

// Review variables
const numberOfReviewsPerPage = 10;

const addressSelector = 'address';
const bizNameSelector = '.biz-name ';

// User profile variables

const userNameSelector = `.user-profile_info > h1`
const userHometownSelector = `.user-location`;

function getCurrentReviewSelector(index) {
    return `.reviews > li:nth-child(${index}) > .review`;
}

function getUserReviewUrl(useId, pageNumber) {
    return `${baseUrl}/user_details_reviews_self?rec_pagestart=${pageNumber*numberOfReviewsPerPage}&userid=${useId}`;
}

function getUserProfileUrl(userId) {
    return `${baseUrl}/user_details?userid=${userId}`;
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

            const currentReviewSelector = getCurrentReviewSelector(reviewIndex);
            const reviewId = $(currentReviewSelector).attr('data-review-id');
            const currentAddressSelector = `${currentReviewSelector} ${addressSelector}`;
            const bizUrl = `baseUrl${$(bizNameSelector).attr('href')}`;

            const reviewDetails = {
                'ReviewId': reviewId,
                'BizName': $(bizNameSelector).text(),
                'Address': $(currentAddressSelector).html()
                    .replace('/\\n/gi', '').trim().replace('<br>', ', '),
                'ReviewLink': `${getReviewLink(reviewId, bizUrl)}`
            };

            reviews.push(reviewDetails);
        }
    }).catch(error => {
        throw new Error(error.toString());
    });

    return reviews;
}

async function reviewScraper(userId, reviewNumberLimit) {

    const userReviewUrl = getUserReviewUrl(userId);
    let reviews = [];
    // let numberOfReviewPages = 0;
    let numberOfReviewPages = reviewNumberLimit / 10;

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
        return res.status(500).json({
            error: err.message,
        });
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
            if (error.response.status == 404) {
                throw new TypeError('User Not Found');
            } else {
                throw new Error(error.toString());
            }
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