const express = require('express');
const axios = require('axios');
const AUTH_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJNYXBDbGFpbXMiOnsiZXhwIjoxNzI0NzM5MjgyLCJpYXQiOjE3MjQ3Mzg5ODIsImlzcyI6IkFmZm9yZG1lZCIsImp0aSI6IjFlNjRkODQyLWNkODAtNGNlMi1hMDg1LWI0NWY0YWFjNWI1YSIsInN1YiI6ImFhdHRhQGdpdGFtLmluIn0sImNvbXBhbnlOYW1lIjoiZ29NYXJ0IiwiY2xpZW50SUQiOiIxZTY0ZDg0Mi1jZDgwLTRjZTItYTA4NS1iNDVmNGFhYzViNWEiLCJjbGllbnRTZWNyZXQiOiJWQUVtd3NuWXFjRHJDWkd6Iiwib3duZXJOYW1lIjoiQXNpc2ggS3VtYXIgQXR0YSIsIm93bmVyRW1haWwiOiJhYXR0YUBnaXRhbS5pbiIsInJvbGxObyI6Imh1MjFjc2VuMDEwMTgwNSJ9.WPnTQQtiNTJisfDdswhizOcjnOcb1fECsmC6Zuf1jXQ";
const app = express();
const port = 9876;

const WINDOW_SIZE = 10;

const baseNumberIds = ['primes', 'fibo', 'even', 'rand'];

const aliasToBase = {
    'p': 'primes',
    'primes': 'primes',
    'f': 'fibo',
    'fibo': 'fibo',
    'e': 'even',
    'even': 'even',
    'r': 'rand',
    'rand': 'rand',
};

const baseToURL = {
    'primes': 'http://20.244.56.144/test/primes',
    'fibo': 'http://20.244.56.144/test/fibo',
    'even': 'http://20.244.56.144/test/even',
    'rand': 'http://20.244.56.144/test/rand',
};

const numberWindows = new Map();
baseNumberIds.forEach(id => {
    numberWindows.set(id, []);
});

app.get('/numbers/:numberid', async (req, res) => {
    const { numberid } = req.params;

    const baseId = aliasToBase[numberid.toLowerCase()];
    if (!baseId) {
        return res.status(400).json({ error: 'Invalid number ID. Valid IDs are p, f, e, r or primes, fibo, even, rand.' });
    }

    const url = baseToURL[baseId];
    const currentWindow = numberWindows.get(baseId) || [];
    const windowPrevState = [...currentWindow]; 

    let numbersFetched = [];
    try {
        const response = await axios.get(url, { timeout: 450,
            headers: {
                'Authorization': `Bearer ${AUTH_TOKEN}` 
            }
         });

        if (response.status === 200 && response.data && Array.isArray(response.data.numbers)) {
            numbersFetched = response.data.numbers;

            numbersFetched.forEach(num => {
                if (!currentWindow.includes(num)) {
                    currentWindow.push(num);
                    if (currentWindow.length > WINDOW_SIZE) {
                        currentWindow.shift(); 
                    }
                }
            });

            numberWindows.set(baseId, currentWindow);
        }
    } catch (error) {
        numbersFetched = [];
    }

    const windowCurrState = [...currentWindow]; 

    let avg = 0.00;
    if (currentWindow.length > 0) {
        const sum = currentWindow.reduce((acc, val) => acc + val, 0);
        avg = parseFloat((sum / currentWindow.length).toFixed(2));
    }

    const responseObj = {
        windowPrevState: windowPrevState,
        windowCurrState: windowCurrState,
        numbers: numbersFetched,
        avg: avg,
    };

    res.json(responseObj);
});

app.listen(port, () => {
    console.log(`Average Calculator microservice is running at http://localhost:${port}`);
});
