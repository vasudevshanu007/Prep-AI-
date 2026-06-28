require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const CodingProblem = require('../models/CodingProblem');
const DSASheet = require('../models/DSASheet');

// ── Internal problems (solvable in platform) ──────────────────────────────────
const INTERNAL = [
  {
    slug: 'contains-duplicate', title: 'Contains Duplicate', difficulty: 'easy',
    topic: 'Arrays', topics: ['Arrays', 'Hash Map'],
    companies: ['Amazon', 'Google', 'Microsoft', 'Adobe'],
    sheetTags: ['neetcode-150', 'blind-75', 'grind-75', 'love-babbar'],
    roadmapTags: ['beginner', 'intermediate', 'faang'], frequencyScore: 8,
    source: 'internal', platform: 'leetcode', platformId: '217',
    externalUrl: 'https://leetcode.com/problems/contains-duplicate/',
    description: 'Given an integer array nums, return true if any value appears at least twice, and false if every element is distinct.\n\nInput: JSON array of integers.\nOutput: true or false.\n\nExample:\nInput: [1,2,3,1]\nOutput: true',
    hints: ['Use a hash set to track seen elements', 'If you see an element already in the set, return true'],
    testCases: [
      { input: '[1,2,3,1]', expectedOutput: 'true' },
      { input: '[1,2,3,4]', expectedOutput: 'false' },
      { input: '[1,1,1,3,3,4,3,2,4,2]', expectedOutput: 'true' },
    ],
  },
  {
    slug: 'best-time-to-buy-and-sell-stock', title: 'Best Time to Buy and Sell Stock', difficulty: 'easy',
    topic: 'Greedy', topics: ['Array', 'Dynamic Programming', 'Greedy'],
    companies: ['Amazon', 'Google', 'Meta', 'Microsoft', 'Flipkart'],
    sheetTags: ['neetcode-150', 'blind-75', 'grind-75', 'striver-sde', 'love-babbar'],
    roadmapTags: ['beginner', 'intermediate', 'faang'], frequencyScore: 9,
    source: 'internal', platform: 'leetcode', platformId: '121',
    externalUrl: 'https://leetcode.com/problems/best-time-to-buy-and-sell-stock/',
    description: 'You are given an array prices where prices[i] is the price of a given stock on the ith day. Return the maximum profit you can achieve from this transaction. If you cannot achieve any profit, return 0.\n\nInput: JSON array of integers (stock prices).\nOutput: Integer (max profit).\n\nExample:\nInput: [7,1,5,3,6,4]\nOutput: 5',
    hints: ['Track the minimum price seen so far', 'Compute profit at each day as price - minPrice'],
    testCases: [
      { input: '[7,1,5,3,6,4]', expectedOutput: '5' },
      { input: '[7,6,4,3,1]', expectedOutput: '0' },
      { input: '[1,2]', expectedOutput: '1' },
    ],
  },
  {
    slug: 'valid-anagram', title: 'Valid Anagram', difficulty: 'easy',
    topic: 'String', topics: ['String', 'Hash Map', 'Sorting'],
    companies: ['Amazon', 'Microsoft', 'Google', 'Adobe'],
    sheetTags: ['neetcode-150', 'blind-75', 'grind-75', 'love-babbar'],
    roadmapTags: ['beginner', 'intermediate', 'faang'], frequencyScore: 8,
    source: 'internal', platform: 'leetcode', platformId: '242',
    externalUrl: 'https://leetcode.com/problems/valid-anagram/',
    description: 'Given two strings s and t, return true if t is an anagram of s, and false otherwise.\n\nInput: Line 1 is s (JSON string), Line 2 is t (JSON string).\nOutput: true or false.\n\nExample:\nInput: "anagram"\\n"nagaram"\nOutput: true',
    hints: ['Count character frequencies in both strings', 'Two strings are anagrams if their character counts are equal'],
    testCases: [
      { input: '"anagram"\n"nagaram"', expectedOutput: 'true' },
      { input: '"rat"\n"car"', expectedOutput: 'false' },
      { input: '"a"\n"a"', expectedOutput: 'true' },
    ],
  },
  {
    slug: 'climbing-stairs', title: 'Climbing Stairs', difficulty: 'easy',
    topic: 'Dynamic Programming', topics: ['Dynamic Programming', 'Math', 'Recursion'],
    companies: ['Amazon', 'Google', 'Microsoft', 'Adobe', 'Uber'],
    sheetTags: ['neetcode-150', 'blind-75', 'grind-75', 'striver-sde', 'love-babbar'],
    roadmapTags: ['beginner', 'intermediate', 'faang'], frequencyScore: 9,
    source: 'internal', platform: 'leetcode', platformId: '70',
    externalUrl: 'https://leetcode.com/problems/climbing-stairs/',
    description: 'You are climbing a staircase. It takes n steps to reach the top. Each time you can either climb 1 or 2 steps. In how many distinct ways can you climb to the top?\n\nInput: Integer n.\nOutput: Integer (number of ways).\n\nExample:\nInput: 5\nOutput: 8',
    hints: ['This is a Fibonacci sequence problem', 'dp[i] = dp[i-1] + dp[i-2]'],
    testCases: [
      { input: '2', expectedOutput: '2' },
      { input: '3', expectedOutput: '3' },
      { input: '5', expectedOutput: '8' },
      { input: '10', expectedOutput: '89' },
    ],
  },
  {
    slug: 'house-robber', title: 'House Robber', difficulty: 'medium',
    topic: 'Dynamic Programming', topics: ['Array', 'Dynamic Programming'],
    companies: ['Amazon', 'Google', 'Microsoft', 'Meta', 'Flipkart'],
    sheetTags: ['neetcode-150', 'blind-75', 'striver-sde', 'love-babbar'],
    roadmapTags: ['intermediate', 'faang'], frequencyScore: 9,
    source: 'internal', platform: 'leetcode', platformId: '198',
    externalUrl: 'https://leetcode.com/problems/house-robber/',
    description: 'You are a professional robber planning to rob houses along a street. Adjacent houses have security systems, so you cannot rob two adjacent houses. Given an integer array nums representing the amount of money of each house, return the maximum amount you can rob without alerting the police.\n\nInput: JSON array of integers.\nOutput: Integer (max money).\n\nExample:\nInput: [1,2,3,1]\nOutput: 4',
    hints: ['At each house, decide to rob it or skip it', 'dp[i] = max(dp[i-1], dp[i-2] + nums[i])'],
    testCases: [
      { input: '[1,2,3,1]', expectedOutput: '4' },
      { input: '[2,7,9,3,1]', expectedOutput: '12' },
      { input: '[2,1]', expectedOutput: '2' },
    ],
  },
  {
    slug: 'coin-change', title: 'Coin Change', difficulty: 'medium',
    topic: 'Dynamic Programming', topics: ['Array', 'Dynamic Programming', 'Breadth-First Search'],
    companies: ['Amazon', 'Google', 'Microsoft', 'Goldman Sachs', 'Uber'],
    sheetTags: ['neetcode-150', 'blind-75', 'grind-75', 'striver-sde', 'love-babbar'],
    roadmapTags: ['intermediate', 'faang'], frequencyScore: 9,
    source: 'internal', platform: 'leetcode', platformId: '322',
    externalUrl: 'https://leetcode.com/problems/coin-change/',
    description: 'You are given an array of coins and an integer amount. Return the fewest number of coins needed to make up that amount. If that amount cannot be made, return -1.\n\nInput: Line 1 is JSON array of coin denominations, Line 2 is the amount.\nOutput: Integer.\n\nExample:\nInput: [1,5,11]\\n15\nOutput: 2',
    hints: ['Use bottom-up DP', 'dp[i] = min coins to make amount i'],
    testCases: [
      { input: '[1,2,5]\n11', expectedOutput: '3' },
      { input: '[2]\n3', expectedOutput: '-1' },
      { input: '[1]\n0', expectedOutput: '0' },
      { input: '[1,5,11]\n15', expectedOutput: '2' },
    ],
  },
  {
    slug: 'product-of-array-except-self', title: 'Product of Array Except Self', difficulty: 'medium',
    topic: 'Arrays', topics: ['Array', 'Prefix Sum'],
    companies: ['Amazon', 'Microsoft', 'Google', 'Meta', 'Adobe', 'Flipkart'],
    sheetTags: ['neetcode-150', 'blind-75', 'striver-sde', 'love-babbar'],
    roadmapTags: ['intermediate', 'faang'], frequencyScore: 9,
    source: 'internal', platform: 'leetcode', platformId: '238',
    externalUrl: 'https://leetcode.com/problems/product-of-array-except-self/',
    description: 'Given an integer array nums, return an array answer such that answer[i] is equal to the product of all the elements of nums except nums[i].\nYou must solve it in O(n) time without using division.\n\nInput: JSON array of integers.\nOutput: JSON array of integers.\n\nExample:\nInput: [1,2,3,4]\nOutput: [24,12,8,6]',
    hints: ['Use prefix and suffix product arrays', 'answer[i] = prefix[i-1] * suffix[i+1]'],
    testCases: [
      { input: '[1,2,3,4]', expectedOutput: '[24,12,8,6]' },
      { input: '[-1,1,0,-3,3]', expectedOutput: '[0,0,9,0,0]' },
    ],
  },
  {
    slug: 'merge-intervals', title: 'Merge Intervals', difficulty: 'medium',
    topic: 'Arrays', topics: ['Array', 'Sorting'],
    companies: ['Amazon', 'Google', 'Microsoft', 'Meta', 'Uber'],
    sheetTags: ['neetcode-150', 'blind-75', 'grind-75', 'striver-sde', 'love-babbar'],
    roadmapTags: ['intermediate', 'faang'], frequencyScore: 9,
    source: 'internal', platform: 'leetcode', platformId: '56',
    externalUrl: 'https://leetcode.com/problems/merge-intervals/',
    description: 'Given an array of intervals where intervals[i] = [starti, endi], merge all overlapping intervals, and return an array of the non-overlapping intervals.\n\nInput: JSON array of [start,end] pairs.\nOutput: JSON array of merged [start,end] pairs.\n\nExample:\nInput: [[1,3],[2,6],[8,10],[15,18]]\nOutput: [[1,6],[8,10],[15,18]]',
    hints: ['Sort intervals by start time', 'Merge if current start <= previous end'],
    testCases: [
      { input: '[[1,3],[2,6],[8,10],[15,18]]', expectedOutput: '[[1,6],[8,10],[15,18]]' },
      { input: '[[1,4],[4,5]]', expectedOutput: '[[1,5]]' },
    ],
  },
  {
    slug: 'maximum-product-subarray', title: 'Maximum Product Subarray', difficulty: 'medium',
    topic: 'Dynamic Programming', topics: ['Array', 'Dynamic Programming'],
    companies: ['Amazon', 'Google', 'Microsoft', 'Meta'],
    sheetTags: ['neetcode-150', 'blind-75', 'striver-sde', 'love-babbar'],
    roadmapTags: ['intermediate', 'faang'], frequencyScore: 8,
    source: 'internal', platform: 'leetcode', platformId: '152',
    externalUrl: 'https://leetcode.com/problems/maximum-product-subarray/',
    description: 'Given an integer array nums, find a subarray that has the largest product and return the product.\n\nInput: JSON array of integers.\nOutput: Integer.\n\nExample:\nInput: [2,3,-2,4]\nOutput: 6',
    hints: ['Track both max and min products (negatives can flip)', 'maxProd = max(nums[i], maxProd*nums[i], minProd*nums[i])'],
    testCases: [
      { input: '[2,3,-2,4]', expectedOutput: '6' },
      { input: '[-2,0,-1]', expectedOutput: '0' },
      { input: '[-2,3,-4]', expectedOutput: '24' },
    ],
  },
  {
    slug: 'single-number', title: 'Single Number', difficulty: 'easy',
    topic: 'Bit Manipulation', topics: ['Array', 'Bit Manipulation'],
    companies: ['Amazon', 'Google', 'Microsoft', 'Adobe'],
    sheetTags: ['neetcode-150', 'blind-75', 'grind-75', 'love-babbar'],
    roadmapTags: ['beginner', 'intermediate', 'faang'], frequencyScore: 7,
    source: 'internal', platform: 'leetcode', platformId: '136',
    externalUrl: 'https://leetcode.com/problems/single-number/',
    description: 'Given a non-empty array of integers nums, every element appears twice except for one. Find that single one.\nYou must implement a solution with O(n) time complexity and O(1) space complexity.\n\nInput: JSON array of integers.\nOutput: Integer.\n\nExample:\nInput: [4,1,2,1,2]\nOutput: 4',
    hints: ['XOR of a number with itself is 0', 'XOR all elements — duplicates cancel out'],
    testCases: [
      { input: '[2,2,1]', expectedOutput: '1' },
      { input: '[4,1,2,1,2]', expectedOutput: '4' },
      { input: '[1]', expectedOutput: '1' },
    ],
  },
  {
    slug: 'missing-number', title: 'Missing Number', difficulty: 'easy',
    topic: 'Bit Manipulation', topics: ['Array', 'Bit Manipulation', 'Math'],
    companies: ['Amazon', 'Microsoft', 'Adobe'],
    sheetTags: ['neetcode-150', 'blind-75', 'grind-75', 'love-babbar'],
    roadmapTags: ['beginner', 'intermediate', 'faang'], frequencyScore: 7,
    source: 'internal', platform: 'leetcode', platformId: '268',
    externalUrl: 'https://leetcode.com/problems/missing-number/',
    description: 'Given an array nums containing n distinct numbers in the range [0, n], return the only number in the range that is missing.\n\nInput: JSON array of integers.\nOutput: Integer.\n\nExample:\nInput: [3,0,1]\nOutput: 2',
    hints: ['Expected sum = n*(n+1)/2', 'Missing = expected sum - actual sum'],
    testCases: [
      { input: '[3,0,1]', expectedOutput: '2' },
      { input: '[0,1]', expectedOutput: '2' },
      { input: '[9,6,4,2,3,5,7,0,1]', expectedOutput: '8' },
    ],
  },
  {
    slug: 'majority-element', title: 'Majority Element', difficulty: 'easy',
    topic: 'Arrays', topics: ['Array', 'Hash Map', 'Sorting', 'Divide and Conquer'],
    companies: ['Amazon', 'Google', 'Microsoft', 'Adobe'],
    sheetTags: ['grind-75', 'striver-sde', 'love-babbar'],
    roadmapTags: ['beginner', 'intermediate'], frequencyScore: 7,
    source: 'internal', platform: 'leetcode', platformId: '169',
    externalUrl: 'https://leetcode.com/problems/majority-element/',
    description: 'Given an array nums of size n, return the majority element. The majority element is the element that appears more than ⌊n/2⌋ times. You may assume that the majority element always exists.\n\nInput: JSON array of integers.\nOutput: Integer.\n\nExample:\nInput: [3,2,3]\nOutput: 3',
    hints: ['Boyer-Moore Voting Algorithm', 'Keep a candidate and a count; flip candidate when count reaches 0'],
    testCases: [
      { input: '[3,2,3]', expectedOutput: '3' },
      { input: '[2,2,1,1,1,2,2]', expectedOutput: '2' },
    ],
  },
  {
    slug: 'move-zeroes', title: 'Move Zeroes', difficulty: 'easy',
    topic: 'Two Pointers', topics: ['Array', 'Two Pointers'],
    companies: ['Amazon', 'Microsoft', 'Adobe'],
    sheetTags: ['grind-75', 'love-babbar'],
    roadmapTags: ['beginner'], frequencyScore: 6,
    source: 'internal', platform: 'leetcode', platformId: '283',
    externalUrl: 'https://leetcode.com/problems/move-zeroes/',
    description: 'Given an integer array nums, move all 0s to the end of it while maintaining the relative order of non-zero elements. Do this in-place.\n\nInput: JSON array of integers.\nOutput: JSON array with zeroes moved to end.\n\nExample:\nInput: [0,1,0,3,12]\nOutput: [1,3,12,0,0]',
    hints: ['Use two pointers: one for current position, one for next non-zero slot'],
    testCases: [
      { input: '[0,1,0,3,12]', expectedOutput: '[1,3,12,0,0]' },
      { input: '[0]', expectedOutput: '[0]' },
      { input: '[1,0,0,2,3]', expectedOutput: '[1,2,3,0,0]' },
    ],
  },
  {
    slug: 'fibonacci-number', title: 'Fibonacci Number', difficulty: 'easy',
    topic: 'Dynamic Programming', topics: ['Math', 'Dynamic Programming', 'Recursion'],
    companies: ['Amazon', 'Google', 'Microsoft'],
    sheetTags: ['love-babbar', 'apna-college'],
    roadmapTags: ['beginner'], frequencyScore: 6,
    source: 'internal', platform: 'leetcode', platformId: '509',
    externalUrl: 'https://leetcode.com/problems/fibonacci-number/',
    description: 'The Fibonacci numbers, commonly denoted F(n) form a sequence: F(0) = 0, F(1) = 1, F(n) = F(n-1) + F(n-2) for n > 1. Given n, calculate F(n).\n\nInput: Integer n.\nOutput: Integer F(n).\n\nExample:\nInput: 10\nOutput: 55',
    hints: ['Use iterative approach to avoid stack overflow', 'Track just the last two values'],
    testCases: [
      { input: '2', expectedOutput: '1' },
      { input: '3', expectedOutput: '2' },
      { input: '10', expectedOutput: '55' },
    ],
  },
  {
    slug: 'find-minimum-in-rotated-sorted-array', title: 'Find Minimum in Rotated Sorted Array', difficulty: 'medium',
    topic: 'Binary Search', topics: ['Array', 'Binary Search'],
    companies: ['Amazon', 'Microsoft', 'Google', 'Meta'],
    sheetTags: ['neetcode-150', 'blind-75', 'striver-sde', 'love-babbar'],
    roadmapTags: ['intermediate', 'faang'], frequencyScore: 8,
    source: 'internal', platform: 'leetcode', platformId: '153',
    externalUrl: 'https://leetcode.com/problems/find-minimum-in-rotated-sorted-array/',
    description: 'Given a sorted rotated array of unique integers, find the minimum element. You must write an algorithm that runs in O(log n) time.\n\nInput: JSON array of integers.\nOutput: Integer (minimum).\n\nExample:\nInput: [3,4,5,1,2]\nOutput: 1',
    hints: ['Use binary search', 'If mid > right, the minimum is in the right half'],
    testCases: [
      { input: '[3,4,5,1,2]', expectedOutput: '1' },
      { input: '[4,5,6,7,0,1,2]', expectedOutput: '0' },
      { input: '[11,13,15,17]', expectedOutput: '11' },
    ],
  },
  {
    slug: 'search-in-rotated-sorted-array', title: 'Search in Rotated Sorted Array', difficulty: 'medium',
    topic: 'Binary Search', topics: ['Array', 'Binary Search'],
    companies: ['Amazon', 'Google', 'Microsoft', 'Meta', 'Adobe'],
    sheetTags: ['neetcode-150', 'blind-75', 'striver-sde', 'love-babbar'],
    roadmapTags: ['intermediate', 'faang'], frequencyScore: 9,
    source: 'internal', platform: 'leetcode', platformId: '33',
    externalUrl: 'https://leetcode.com/problems/search-in-rotated-sorted-array/',
    description: 'Given an integer array nums sorted in ascending order but then possibly rotated at some pivot, and an integer target, return the index of target or -1 if not found. You must run in O(log n) time.\n\nInput: Line 1 is JSON array, Line 2 is target.\nOutput: Integer index.\n\nExample:\nInput: [4,5,6,7,0,1,2]\\n0\nOutput: 4',
    hints: ['Modified binary search', 'Determine which half is sorted, then check if target is in that half'],
    testCases: [
      { input: '[4,5,6,7,0,1,2]\n0', expectedOutput: '4' },
      { input: '[4,5,6,7,0,1,2]\n3', expectedOutput: '-1' },
      { input: '[1]\n0', expectedOutput: '-1' },
    ],
  },
  {
    slug: 'jump-game', title: 'Jump Game', difficulty: 'medium',
    topic: 'Greedy', topics: ['Array', 'Greedy', 'Dynamic Programming'],
    companies: ['Amazon', 'Google', 'Microsoft'],
    sheetTags: ['neetcode-150', 'blind-75', 'grind-75', 'striver-sde', 'love-babbar'],
    roadmapTags: ['intermediate', 'faang'], frequencyScore: 8,
    source: 'internal', platform: 'leetcode', platformId: '55',
    externalUrl: 'https://leetcode.com/problems/jump-game/',
    description: 'You are given an integer array nums. You are initially positioned at the first index, and each element represents your maximum jump length at that position. Return true if you can reach the last index, or false otherwise.\n\nInput: JSON array of integers.\nOutput: true or false.\n\nExample:\nInput: [2,3,1,1,4]\nOutput: true',
    hints: ['Track the maximum reachable index', 'If current index > max reachable, return false'],
    testCases: [
      { input: '[2,3,1,1,4]', expectedOutput: 'true' },
      { input: '[3,2,1,0,4]', expectedOutput: 'false' },
      { input: '[0]', expectedOutput: 'true' },
    ],
  },
  {
    slug: 'unique-paths', title: 'Unique Paths', difficulty: 'medium',
    topic: 'Dynamic Programming', topics: ['Math', 'Dynamic Programming', 'Combinatorics'],
    companies: ['Amazon', 'Google', 'Microsoft', 'Goldman Sachs'],
    sheetTags: ['neetcode-150', 'blind-75', 'striver-sde', 'love-babbar'],
    roadmapTags: ['intermediate', 'faang'], frequencyScore: 8,
    source: 'internal', platform: 'leetcode', platformId: '62',
    externalUrl: 'https://leetcode.com/problems/unique-paths/',
    description: 'A robot is located at the top-left corner of an m x n grid. The robot can only move either down or right. How many possible unique paths are there to reach the bottom-right corner?\n\nInput: Line 1 is m (rows), Line 2 is n (columns).\nOutput: Integer.\n\nExample:\nInput: 3\\n7\nOutput: 28',
    hints: ['dp[i][j] = dp[i-1][j] + dp[i][j-1]', 'First row and column are all 1s'],
    testCases: [
      { input: '3\n7', expectedOutput: '28' },
      { input: '3\n2', expectedOutput: '3' },
      { input: '1\n1', expectedOutput: '1' },
    ],
  },
  {
    slug: 'decode-ways', title: 'Decode Ways', difficulty: 'medium',
    topic: 'Dynamic Programming', topics: ['String', 'Dynamic Programming'],
    companies: ['Amazon', 'Google', 'Microsoft', 'Meta', 'Goldman Sachs'],
    sheetTags: ['neetcode-150', 'blind-75', 'striver-sde', 'love-babbar'],
    roadmapTags: ['intermediate', 'faang'], frequencyScore: 8,
    source: 'internal', platform: 'leetcode', platformId: '91',
    externalUrl: 'https://leetcode.com/problems/decode-ways/',
    description: "A message containing letters A-Z is encoded with numbers 1-26. Given a string of digits, return the number of ways to decode it.\n\nInput: JSON string of digits.\nOutput: Integer.\n\nExample:\nInput: \"12\"\nOutput: 2",
    hints: ['dp[i] = number of ways to decode s[0..i-1]', 'Check single and two-digit decodings at each step'],
    testCases: [
      { input: '"12"', expectedOutput: '2' },
      { input: '"226"', expectedOutput: '3' },
      { input: '"06"', expectedOutput: '0' },
    ],
  },
  {
    slug: 'word-break', title: 'Word Break', difficulty: 'medium',
    topic: 'Dynamic Programming', topics: ['Hash Table', 'String', 'Dynamic Programming'],
    companies: ['Amazon', 'Google', 'Microsoft', 'Meta'],
    sheetTags: ['neetcode-150', 'blind-75', 'striver-sde', 'love-babbar'],
    roadmapTags: ['intermediate', 'faang'], frequencyScore: 8,
    source: 'internal', platform: 'leetcode', platformId: '139',
    externalUrl: 'https://leetcode.com/problems/word-break/',
    description: 'Given a string s and a dictionary of strings wordDict, return true if s can be segmented into a space-separated sequence of dictionary words.\n\nInput: Line 1 is the string (JSON), Line 2 is the word dictionary (JSON array).\nOutput: true or false.\n\nExample:\nInput: "leetcode"\\n["leet","code"]\nOutput: true',
    hints: ['dp[i] = can s[0..i-1] be segmented?', 'For each i, try all words that end at position i'],
    testCases: [
      { input: '"leetcode"\n["leet","code"]', expectedOutput: 'true' },
      { input: '"applepenapple"\n["apple","pen"]', expectedOutput: 'true' },
      { input: '"catsandog"\n["cats","dog","sand","and","cat"]', expectedOutput: 'false' },
    ],
  },
  {
    slug: 'longest-increasing-subsequence', title: 'Longest Increasing Subsequence', difficulty: 'medium',
    topic: 'Dynamic Programming', topics: ['Array', 'Binary Search', 'Dynamic Programming'],
    companies: ['Amazon', 'Google', 'Microsoft', 'Meta', 'Adobe'],
    sheetTags: ['neetcode-150', 'blind-75', 'striver-sde', 'love-babbar'],
    roadmapTags: ['intermediate', 'faang'], frequencyScore: 9,
    source: 'internal', platform: 'leetcode', platformId: '300',
    externalUrl: 'https://leetcode.com/problems/longest-increasing-subsequence/',
    description: 'Given an integer array nums, return the length of the longest strictly increasing subsequence.\n\nInput: JSON array of integers.\nOutput: Integer.\n\nExample:\nInput: [10,9,2,5,3,7,101,18]\nOutput: 4',
    hints: ['dp[i] = length of LIS ending at index i', 'For each i, check all j < i where nums[j] < nums[i]'],
    testCases: [
      { input: '[10,9,2,5,3,7,101,18]', expectedOutput: '4' },
      { input: '[0,1,0,3,2,3]', expectedOutput: '4' },
      { input: '[7,7,7,7,7,7,7]', expectedOutput: '1' },
    ],
  },
  {
    slug: 'number-of-islands', title: 'Number of Islands', difficulty: 'medium',
    topic: 'Graphs', topics: ['Array', 'Depth-First Search', 'Breadth-First Search', 'Union Find'],
    companies: ['Amazon', 'Google', 'Microsoft', 'Meta', 'Uber'],
    sheetTags: ['neetcode-150', 'blind-75', 'grind-75', 'striver-sde', 'love-babbar'],
    roadmapTags: ['intermediate', 'faang'], frequencyScore: 9,
    source: 'internal', platform: 'leetcode', platformId: '200',
    externalUrl: 'https://leetcode.com/problems/number-of-islands/',
    description: 'Given an m x n 2D binary grid which represents a map of \'1\'s (land) and \'0\'s (water), return the number of islands.\n\nInput: JSON 2D array of "1"s and "0"s.\nOutput: Integer.\n\nExample:\nInput: [["1","1","0","0","0"],["1","1","0","0","0"],["0","0","1","0","0"],["0","0","0","1","1"]]\nOutput: 3',
    hints: ['DFS/BFS from each unvisited land cell', 'Mark visited cells to avoid counting them again'],
    testCases: [
      { input: '[["1","1","0","0","0"],["1","1","0","0","0"],["0","0","1","0","0"],["0","0","0","1","1"]]', expectedOutput: '3' },
      { input: '[["1","1","1","1","0"],["1","1","0","1","0"],["1","1","0","0","0"],["0","0","0","0","0"]]', expectedOutput: '1' },
    ],
  },
  {
    slug: 'max-area-of-island', title: 'Max Area of Island', difficulty: 'medium',
    topic: 'Graphs', topics: ['Array', 'Depth-First Search', 'Union Find'],
    companies: ['Amazon', 'Google', 'Microsoft'],
    sheetTags: ['neetcode-150', 'striver-sde', 'love-babbar'],
    roadmapTags: ['intermediate', 'faang'], frequencyScore: 7,
    source: 'internal', platform: 'leetcode', platformId: '695',
    externalUrl: 'https://leetcode.com/problems/max-area-of-island/',
    description: 'You are given an m x n binary matrix grid. An island is a group of 1\'s connected 4-directionally. Return the maximum area of an island in grid, or 0 if there is no island.\n\nInput: JSON 2D array of integers.\nOutput: Integer.\n\nExample:\nInput: [[0,0,1,0],[0,0,0,0],[0,1,1,0],[0,1,0,0]]\nOutput: 3',
    hints: ['DFS from each unvisited 1', 'Return the size of the island and track max'],
    testCases: [
      { input: '[[0,0,1,0],[0,0,0,0],[0,1,1,0],[0,1,0,0]]', expectedOutput: '3' },
      { input: '[[0,0,0,0,0,0,0,0]]', expectedOutput: '0' },
    ],
  },
  {
    slug: 'kth-largest-element-in-array', title: 'Kth Largest Element in an Array', difficulty: 'medium',
    topic: 'Heap', topics: ['Array', 'Divide and Conquer', 'Sorting', 'Heap (Priority Queue)', 'Quickselect'],
    companies: ['Amazon', 'Google', 'Microsoft', 'Meta', 'Adobe'],
    sheetTags: ['neetcode-150', 'grind-75', 'striver-sde', 'love-babbar'],
    roadmapTags: ['intermediate', 'faang'], frequencyScore: 9,
    source: 'internal', platform: 'leetcode', platformId: '215',
    externalUrl: 'https://leetcode.com/problems/kth-largest-element-in-an-array/',
    description: 'Given an integer array nums and an integer k, return the kth largest element in the array. Note that it is the kth largest element in the sorted order, not the kth distinct element.\n\nInput: Line 1 is JSON array, Line 2 is k.\nOutput: Integer.\n\nExample:\nInput: [3,2,1,5,6,4]\\n2\nOutput: 5',
    hints: ['Sort and index from end, or use a min-heap of size k'],
    testCases: [
      { input: '[3,2,1,5,6,4]\n2', expectedOutput: '5' },
      { input: '[3,2,3,1,2,4,5,5,6]\n4', expectedOutput: '4' },
    ],
  },
  {
    slug: 'top-k-frequent-elements', title: 'Top K Frequent Elements', difficulty: 'medium',
    topic: 'Heap', topics: ['Array', 'Hash Table', 'Bucket Sort', 'Heap (Priority Queue)'],
    companies: ['Amazon', 'Google', 'Microsoft', 'Meta'],
    sheetTags: ['neetcode-150', 'blind-75', 'grind-75', 'striver-sde'],
    roadmapTags: ['intermediate', 'faang'], frequencyScore: 8,
    source: 'internal', platform: 'leetcode', platformId: '347',
    externalUrl: 'https://leetcode.com/problems/top-k-frequent-elements/',
    description: 'Given an integer array nums and an integer k, return the k most frequent elements. You may return the answer in any order.\n\nInput: Line 1 is JSON array, Line 2 is k.\nOutput: JSON array of integers sorted ascending.\n\nExample:\nInput: [1,1,1,2,2,3]\\n2\nOutput: [1,2]',
    hints: ['Use a frequency map', 'Sort by frequency and take top k'],
    testCases: [
      { input: '[1,1,1,2,2,3]\n2', expectedOutput: '[1,2]' },
      { input: '[1]\n1', expectedOutput: '[1]' },
    ],
  },
  {
    slug: 'valid-palindrome', title: 'Valid Palindrome', difficulty: 'easy',
    topic: 'Two Pointers', topics: ['Two Pointers', 'String'],
    companies: ['Amazon', 'Google', 'Microsoft', 'Meta', 'Adobe'],
    sheetTags: ['neetcode-150', 'blind-75', 'grind-75', 'love-babbar'],
    roadmapTags: ['beginner', 'intermediate', 'faang'], frequencyScore: 8,
    source: 'internal', platform: 'leetcode', platformId: '125',
    externalUrl: 'https://leetcode.com/problems/valid-palindrome/',
    description: 'A phrase is a palindrome if, after converting all uppercase letters to lowercase and removing all non-alphanumeric characters, it reads the same forward and backward.\n\nInput: JSON string.\nOutput: true or false.\n\nExample:\nInput: "A man, a plan, a canal: Panama"\nOutput: true',
    hints: ['Clean the string first (lowercase + remove non-alphanumeric)', 'Use two pointers from both ends'],
    testCases: [
      { input: '"A man, a plan, a canal: Panama"', expectedOutput: 'true' },
      { input: '"race a car"', expectedOutput: 'false' },
      { input: '" "', expectedOutput: 'true' },
    ],
  },
  {
    slug: 'sqrt-x', title: 'Sqrt(x)', difficulty: 'easy',
    topic: 'Binary Search', topics: ['Math', 'Binary Search'],
    companies: ['Amazon', 'Microsoft', 'Google'],
    sheetTags: ['grind-75', 'love-babbar'],
    roadmapTags: ['beginner'], frequencyScore: 6,
    source: 'internal', platform: 'leetcode', platformId: '69',
    externalUrl: 'https://leetcode.com/problems/sqrtx/',
    description: 'Given a non-negative integer x, return the square root of x rounded down to the nearest integer. The returned integer should be non-negative too.\nYou must not use any built-in exponent function or operator.\n\nInput: Integer x.\nOutput: Integer.\n\nExample:\nInput: 8\nOutput: 2',
    hints: ['Binary search in range [0, x]', 'Find the largest integer m where m*m <= x'],
    testCases: [
      { input: '4', expectedOutput: '2' },
      { input: '8', expectedOutput: '2' },
      { input: '0', expectedOutput: '0' },
    ],
  },
  {
    slug: 'power-of-two', title: 'Power of Two', difficulty: 'easy',
    topic: 'Bit Manipulation', topics: ['Math', 'Bit Manipulation', 'Recursion'],
    companies: ['Amazon', 'Microsoft'],
    sheetTags: ['love-babbar', 'apna-college'],
    roadmapTags: ['beginner'], frequencyScore: 5,
    source: 'internal', platform: 'leetcode', platformId: '231',
    externalUrl: 'https://leetcode.com/problems/power-of-two/',
    description: 'Given an integer n, return true if it is a power of two. Otherwise, return false.\n\nInput: Integer n.\nOutput: true or false.\n\nExample:\nInput: 16\nOutput: true',
    hints: ['n & (n-1) == 0 for powers of two', 'Also check n > 0'],
    testCases: [
      { input: '1', expectedOutput: 'true' },
      { input: '16', expectedOutput: 'true' },
      { input: '3', expectedOutput: 'false' },
    ],
  },
  {
    slug: 'number-of-1-bits', title: 'Number of 1 Bits', difficulty: 'easy',
    topic: 'Bit Manipulation', topics: ['Divide and Conquer', 'Bit Manipulation'],
    companies: ['Amazon', 'Google', 'Microsoft'],
    sheetTags: ['neetcode-150', 'blind-75', 'grind-75', 'love-babbar'],
    roadmapTags: ['beginner', 'intermediate', 'faang'], frequencyScore: 7,
    source: 'internal', platform: 'leetcode', platformId: '191',
    externalUrl: 'https://leetcode.com/problems/number-of-1-bits/',
    description: 'Write a function that takes the binary representation of an unsigned integer and returns the number of \'1\' bits it has (also known as the Hamming weight).\n\nInput: Integer n.\nOutput: Integer (count of 1 bits).\n\nExample:\nInput: 11\nOutput: 3 (binary: 1011)',
    hints: ['n & 1 gives the last bit', 'Right-shift n and repeat; or use n & (n-1) to clear the lowest set bit'],
    testCases: [
      { input: '11', expectedOutput: '3' },
      { input: '128', expectedOutput: '1' },
      { input: '4294967293', expectedOutput: '31' },
    ],
  },
  {
    slug: 'partition-equal-subset-sum', title: 'Partition Equal Subset Sum', difficulty: 'medium',
    topic: 'Dynamic Programming', topics: ['Array', 'Dynamic Programming'],
    companies: ['Amazon', 'Google', 'Microsoft'],
    sheetTags: ['neetcode-150', 'blind-75', 'striver-sde', 'love-babbar'],
    roadmapTags: ['intermediate', 'faang'], frequencyScore: 8,
    source: 'internal', platform: 'leetcode', platformId: '416',
    externalUrl: 'https://leetcode.com/problems/partition-equal-subset-sum/',
    description: 'Given an integer array nums, return true if you can partition the array into two subsets such that the sum of the elements in both subsets is equal.\n\nInput: JSON array of integers.\nOutput: true or false.\n\nExample:\nInput: [1,5,11,5]\nOutput: true',
    hints: ['This is a 0/1 knapsack problem', 'Target = total_sum / 2; find if a subset sums to target'],
    testCases: [
      { input: '[1,5,11,5]', expectedOutput: 'true' },
      { input: '[1,2,3,5]', expectedOutput: 'false' },
    ],
  },
];

// ── External problems (metadata only — link to LeetCode) ──────────────────────
const EXTERNAL = [
  // Arrays & Two Pointers
  { slug: 'two-sum-ii', title: 'Two Sum II - Input Array Is Sorted', difficulty: 'medium', topic: 'Two Pointers', topics: ['Array', 'Two Pointers', 'Binary Search'], companies: ['Amazon', 'Microsoft'], sheetTags: ['neetcode-150'], source: 'external', platform: 'leetcode', platformId: '167', externalUrl: 'https://leetcode.com/problems/two-sum-ii-input-array-is-sorted/', frequencyScore: 7 },
  { slug: 'three-sum', title: '3Sum', difficulty: 'medium', topic: 'Two Pointers', topics: ['Array', 'Two Pointers', 'Sorting'], companies: ['Amazon', 'Google', 'Microsoft', 'Meta', 'Adobe'], sheetTags: ['neetcode-150', 'blind-75', 'grind-75', 'striver-sde'], source: 'external', platform: 'leetcode', platformId: '15', externalUrl: 'https://leetcode.com/problems/3sum/', frequencyScore: 9 },
  { slug: 'container-with-most-water', title: 'Container With Most Water', difficulty: 'medium', topic: 'Two Pointers', topics: ['Array', 'Two Pointers', 'Greedy'], companies: ['Amazon', 'Google', 'Microsoft', 'Meta'], sheetTags: ['neetcode-150', 'blind-75', 'grind-75'], source: 'external', platform: 'leetcode', platformId: '11', externalUrl: 'https://leetcode.com/problems/container-with-most-water/', frequencyScore: 9 },
  { slug: 'trapping-rain-water', title: 'Trapping Rain Water', difficulty: 'hard', topic: 'Two Pointers', topics: ['Array', 'Two Pointers', 'Dynamic Programming', 'Stack', 'Monotonic Stack'], companies: ['Amazon', 'Google', 'Microsoft', 'Meta'], sheetTags: ['neetcode-150', 'blind-75', 'striver-sde'], source: 'external', platform: 'leetcode', platformId: '42', externalUrl: 'https://leetcode.com/problems/trapping-rain-water/', frequencyScore: 10 },
  // Sliding Window
  { slug: 'longest-substring-without-repeating', title: 'Longest Substring Without Repeating Characters', difficulty: 'medium', topic: 'Sliding Window', topics: ['Hash Table', 'String', 'Sliding Window'], companies: ['Amazon', 'Google', 'Microsoft', 'Meta', 'Adobe'], sheetTags: ['neetcode-150', 'blind-75', 'grind-75', 'striver-sde'], source: 'external', platform: 'leetcode', platformId: '3', externalUrl: 'https://leetcode.com/problems/longest-substring-without-repeating-characters/', frequencyScore: 10 },
  { slug: 'minimum-window-substring', title: 'Minimum Window Substring', difficulty: 'hard', topic: 'Sliding Window', topics: ['Hash Table', 'String', 'Sliding Window'], companies: ['Amazon', 'Google', 'Microsoft', 'Meta'], sheetTags: ['neetcode-150', 'blind-75'], source: 'external', platform: 'leetcode', platformId: '76', externalUrl: 'https://leetcode.com/problems/minimum-window-substring/', frequencyScore: 8 },
  { slug: 'longest-repeating-character-replacement', title: 'Longest Repeating Character Replacement', difficulty: 'medium', topic: 'Sliding Window', topics: ['Hash Table', 'String', 'Sliding Window'], companies: ['Amazon', 'Google'], sheetTags: ['neetcode-150', 'blind-75'], source: 'external', platform: 'leetcode', platformId: '424', externalUrl: 'https://leetcode.com/problems/longest-repeating-character-replacement/', frequencyScore: 7 },
  // Stack
  { slug: 'min-stack', title: 'Min Stack', difficulty: 'medium', topic: 'Stack', topics: ['Stack', 'Design'], companies: ['Amazon', 'Google', 'Microsoft', 'Meta'], sheetTags: ['neetcode-150', 'blind-75', 'grind-75'], source: 'external', platform: 'leetcode', platformId: '155', externalUrl: 'https://leetcode.com/problems/min-stack/', frequencyScore: 8 },
  { slug: 'daily-temperatures', title: 'Daily Temperatures', difficulty: 'medium', topic: 'Stack', topics: ['Array', 'Stack', 'Monotonic Stack'], companies: ['Amazon', 'Google'], sheetTags: ['neetcode-150', 'grind-75'], source: 'external', platform: 'leetcode', platformId: '739', externalUrl: 'https://leetcode.com/problems/daily-temperatures/', frequencyScore: 7 },
  { slug: 'largest-rectangle-in-histogram', title: 'Largest Rectangle in Histogram', difficulty: 'hard', topic: 'Stack', topics: ['Array', 'Stack', 'Monotonic Stack'], companies: ['Amazon', 'Google', 'Microsoft', 'Meta'], sheetTags: ['neetcode-150', 'blind-75', 'striver-sde'], source: 'external', platform: 'leetcode', platformId: '84', externalUrl: 'https://leetcode.com/problems/largest-rectangle-in-histogram/', frequencyScore: 8 },
  { slug: 'generate-parentheses', title: 'Generate Parentheses', difficulty: 'medium', topic: 'Backtracking', topics: ['String', 'Dynamic Programming', 'Backtracking'], companies: ['Amazon', 'Google', 'Microsoft', 'Meta'], sheetTags: ['neetcode-150', 'blind-75', 'grind-75'], source: 'external', platform: 'leetcode', platformId: '22', externalUrl: 'https://leetcode.com/problems/generate-parentheses/', frequencyScore: 8 },
  // Linked List
  { slug: 'merge-two-sorted-lists', title: 'Merge Two Sorted Lists', difficulty: 'easy', topic: 'Linked List', topics: ['Linked List', 'Recursion'], companies: ['Amazon', 'Google', 'Microsoft', 'Meta'], sheetTags: ['neetcode-150', 'blind-75', 'grind-75', 'striver-sde'], source: 'external', platform: 'leetcode', platformId: '21', externalUrl: 'https://leetcode.com/problems/merge-two-sorted-lists/', frequencyScore: 9 },
  { slug: 'linked-list-cycle', title: 'Linked List Cycle', difficulty: 'easy', topic: 'Linked List', topics: ['Hash Table', 'Linked List', 'Two Pointers'], companies: ['Amazon', 'Google', 'Microsoft', 'Meta'], sheetTags: ['neetcode-150', 'blind-75', 'grind-75', 'striver-sde'], source: 'external', platform: 'leetcode', platformId: '141', externalUrl: 'https://leetcode.com/problems/linked-list-cycle/', frequencyScore: 8 },
  { slug: 'lru-cache', title: 'LRU Cache', difficulty: 'medium', topic: 'Linked List', topics: ['Hash Table', 'Linked List', 'Design', 'Doubly-Linked List'], companies: ['Amazon', 'Google', 'Microsoft', 'Meta', 'Uber'], sheetTags: ['neetcode-150', 'blind-75', 'striver-sde'], source: 'external', platform: 'leetcode', platformId: '146', externalUrl: 'https://leetcode.com/problems/lru-cache/', frequencyScore: 9 },
  { slug: 'merge-k-sorted-lists', title: 'Merge K Sorted Lists', difficulty: 'hard', topic: 'Linked List', topics: ['Linked List', 'Divide and Conquer', 'Heap'], companies: ['Amazon', 'Google', 'Microsoft', 'Meta'], sheetTags: ['neetcode-150', 'blind-75', 'striver-sde'], source: 'external', platform: 'leetcode', platformId: '23', externalUrl: 'https://leetcode.com/problems/merge-k-sorted-lists/', frequencyScore: 9 },
  { slug: 'remove-nth-node-from-end', title: 'Remove Nth Node From End of List', difficulty: 'medium', topic: 'Linked List', topics: ['Linked List', 'Two Pointers'], companies: ['Amazon', 'Google', 'Microsoft'], sheetTags: ['neetcode-150', 'blind-75'], source: 'external', platform: 'leetcode', platformId: '19', externalUrl: 'https://leetcode.com/problems/remove-nth-node-from-end-of-list/', frequencyScore: 7 },
  { slug: 'reorder-list', title: 'Reorder List', difficulty: 'medium', topic: 'Linked List', topics: ['Linked List', 'Two Pointers', 'Stack', 'Recursion'], companies: ['Amazon', 'Google', 'Microsoft'], sheetTags: ['neetcode-150', 'blind-75'], source: 'external', platform: 'leetcode', platformId: '143', externalUrl: 'https://leetcode.com/problems/reorder-list/', frequencyScore: 7 },
  // Trees
  { slug: 'invert-binary-tree', title: 'Invert Binary Tree', difficulty: 'easy', topic: 'Trees', topics: ['Tree', 'BFS', 'DFS', 'Binary Tree'], companies: ['Amazon', 'Google', 'Microsoft', 'Meta'], sheetTags: ['neetcode-150', 'blind-75', 'grind-75', 'striver-sde'], source: 'external', platform: 'leetcode', platformId: '226', externalUrl: 'https://leetcode.com/problems/invert-binary-tree/', frequencyScore: 8 },
  { slug: 'maximum-depth-binary-tree', title: 'Maximum Depth of Binary Tree', difficulty: 'easy', topic: 'Trees', topics: ['Tree', 'DFS', 'BFS', 'Binary Tree'], companies: ['Amazon', 'Google', 'Microsoft', 'Meta'], sheetTags: ['neetcode-150', 'blind-75', 'grind-75', 'striver-sde'], source: 'external', platform: 'leetcode', platformId: '104', externalUrl: 'https://leetcode.com/problems/maximum-depth-of-binary-tree/', frequencyScore: 8 },
  { slug: 'same-tree', title: 'Same Tree', difficulty: 'easy', topic: 'Trees', topics: ['Tree', 'DFS', 'BFS', 'Binary Tree'], companies: ['Amazon', 'Microsoft'], sheetTags: ['neetcode-150', 'blind-75'], source: 'external', platform: 'leetcode', platformId: '100', externalUrl: 'https://leetcode.com/problems/same-tree/', frequencyScore: 6 },
  { slug: 'lowest-common-ancestor-bst', title: 'Lowest Common Ancestor of a BST', difficulty: 'medium', topic: 'Trees', topics: ['Tree', 'DFS', 'Binary Search Tree', 'Binary Tree'], companies: ['Amazon', 'Google', 'Microsoft', 'Meta'], sheetTags: ['neetcode-150', 'blind-75', 'grind-75'], source: 'external', platform: 'leetcode', platformId: '235', externalUrl: 'https://leetcode.com/problems/lowest-common-ancestor-of-a-binary-search-tree/', frequencyScore: 8 },
  { slug: 'binary-tree-level-order-traversal', title: 'Binary Tree Level Order Traversal', difficulty: 'medium', topic: 'Trees', topics: ['Tree', 'BFS', 'Binary Tree'], companies: ['Amazon', 'Google', 'Microsoft', 'Meta'], sheetTags: ['neetcode-150', 'blind-75', 'grind-75', 'striver-sde'], source: 'external', platform: 'leetcode', platformId: '102', externalUrl: 'https://leetcode.com/problems/binary-tree-level-order-traversal/', frequencyScore: 9 },
  { slug: 'validate-bst', title: 'Validate Binary Search Tree', difficulty: 'medium', topic: 'Trees', topics: ['Tree', 'DFS', 'Binary Search Tree', 'Binary Tree'], companies: ['Amazon', 'Google', 'Microsoft', 'Meta'], sheetTags: ['neetcode-150', 'blind-75', 'striver-sde'], source: 'external', platform: 'leetcode', platformId: '98', externalUrl: 'https://leetcode.com/problems/validate-binary-search-tree/', frequencyScore: 8 },
  { slug: 'binary-tree-max-path-sum', title: 'Binary Tree Maximum Path Sum', difficulty: 'hard', topic: 'Trees', topics: ['Dynamic Programming', 'Tree', 'DFS', 'Binary Tree'], companies: ['Amazon', 'Google', 'Microsoft', 'Meta'], sheetTags: ['neetcode-150', 'blind-75'], source: 'external', platform: 'leetcode', platformId: '124', externalUrl: 'https://leetcode.com/problems/binary-tree-maximum-path-sum/', frequencyScore: 8 },
  { slug: 'serialize-deserialize-binary-tree', title: 'Serialize and Deserialize Binary Tree', difficulty: 'hard', topic: 'Trees', topics: ['String', 'Tree', 'DFS', 'BFS', 'Design', 'Binary Tree'], companies: ['Amazon', 'Google', 'Microsoft', 'Meta', 'Uber'], sheetTags: ['neetcode-150', 'blind-75'], source: 'external', platform: 'leetcode', platformId: '297', externalUrl: 'https://leetcode.com/problems/serialize-and-deserialize-binary-tree/', frequencyScore: 8 },
  { slug: 'kth-smallest-in-bst', title: 'Kth Smallest Element in a BST', difficulty: 'medium', topic: 'Trees', topics: ['Tree', 'DFS', 'Binary Search Tree', 'Binary Tree'], companies: ['Amazon', 'Google', 'Microsoft', 'Meta'], sheetTags: ['neetcode-150', 'blind-75'], source: 'external', platform: 'leetcode', platformId: '230', externalUrl: 'https://leetcode.com/problems/kth-smallest-element-in-a-bst/', frequencyScore: 7 },
  { slug: 'construct-binary-tree-preorder-inorder', title: 'Construct Binary Tree from Preorder and Inorder Traversal', difficulty: 'medium', topic: 'Trees', topics: ['Array', 'Hash Table', 'Divide and Conquer', 'Tree', 'Binary Tree'], companies: ['Amazon', 'Google', 'Microsoft', 'Meta'], sheetTags: ['neetcode-150', 'blind-75', 'striver-sde'], source: 'external', platform: 'leetcode', platformId: '105', externalUrl: 'https://leetcode.com/problems/construct-binary-tree-from-preorder-and-inorder-traversal/', frequencyScore: 7 },
  // Tries
  { slug: 'implement-trie', title: 'Implement Trie (Prefix Tree)', difficulty: 'medium', topic: 'Tries', topics: ['Hash Table', 'String', 'Design', 'Trie'], companies: ['Amazon', 'Google', 'Microsoft', 'Meta'], sheetTags: ['neetcode-150', 'blind-75', 'striver-sde'], source: 'external', platform: 'leetcode', platformId: '208', externalUrl: 'https://leetcode.com/problems/implement-trie-prefix-tree/', frequencyScore: 8 },
  { slug: 'word-search', title: 'Word Search', difficulty: 'medium', topic: 'Backtracking', topics: ['Array', 'Backtracking', 'Matrix'], companies: ['Amazon', 'Google', 'Microsoft', 'Meta'], sheetTags: ['neetcode-150', 'blind-75', 'striver-sde'], source: 'external', platform: 'leetcode', platformId: '79', externalUrl: 'https://leetcode.com/problems/word-search/', frequencyScore: 8 },
  // Heap
  { slug: 'find-median-from-data-stream', title: 'Find Median from Data Stream', difficulty: 'hard', topic: 'Heap', topics: ['Two Pointers', 'Design', 'Sorting', 'Heap'], companies: ['Amazon', 'Google', 'Microsoft', 'Meta'], sheetTags: ['neetcode-150', 'blind-75'], source: 'external', platform: 'leetcode', platformId: '295', externalUrl: 'https://leetcode.com/problems/find-median-from-data-stream/', frequencyScore: 8 },
  { slug: 'task-scheduler', title: 'Task Scheduler', difficulty: 'medium', topic: 'Heap', topics: ['Array', 'Hash Table', 'Greedy', 'Sorting', 'Heap', 'Counting'], companies: ['Amazon', 'Google', 'Microsoft'], sheetTags: ['neetcode-150', 'blind-75'], source: 'external', platform: 'leetcode', platformId: '621', externalUrl: 'https://leetcode.com/problems/task-scheduler/', frequencyScore: 7 },
  { slug: 'k-closest-points-to-origin', title: 'K Closest Points to Origin', difficulty: 'medium', topic: 'Heap', topics: ['Array', 'Math', 'Divide and Conquer', 'Geometry', 'Sorting', 'Heap', 'Quickselect'], companies: ['Amazon', 'Google', 'Microsoft', 'Meta'], sheetTags: ['neetcode-150', 'grind-75'], source: 'external', platform: 'leetcode', platformId: '973', externalUrl: 'https://leetcode.com/problems/k-closest-points-to-origin/', frequencyScore: 8 },
  // Backtracking
  { slug: 'subsets', title: 'Subsets', difficulty: 'medium', topic: 'Backtracking', topics: ['Array', 'Backtracking', 'Bit Manipulation'], companies: ['Amazon', 'Google', 'Microsoft', 'Meta'], sheetTags: ['neetcode-150', 'blind-75', 'striver-sde'], source: 'external', platform: 'leetcode', platformId: '78', externalUrl: 'https://leetcode.com/problems/subsets/', frequencyScore: 8 },
  { slug: 'combination-sum', title: 'Combination Sum', difficulty: 'medium', topic: 'Backtracking', topics: ['Array', 'Backtracking'], companies: ['Amazon', 'Google', 'Microsoft', 'Meta', 'Adobe'], sheetTags: ['neetcode-150', 'blind-75', 'grind-75', 'striver-sde'], source: 'external', platform: 'leetcode', platformId: '39', externalUrl: 'https://leetcode.com/problems/combination-sum/', frequencyScore: 8 },
  { slug: 'permutations', title: 'Permutations', difficulty: 'medium', topic: 'Backtracking', topics: ['Array', 'Backtracking'], companies: ['Amazon', 'Google', 'Microsoft', 'Meta'], sheetTags: ['neetcode-150', 'blind-75', 'grind-75', 'striver-sde'], source: 'external', platform: 'leetcode', platformId: '46', externalUrl: 'https://leetcode.com/problems/permutations/', frequencyScore: 8 },
  { slug: 'letter-combinations-phone', title: 'Letter Combinations of a Phone Number', difficulty: 'medium', topic: 'Backtracking', topics: ['Hash Table', 'String', 'Backtracking'], companies: ['Amazon', 'Google', 'Microsoft', 'Meta'], sheetTags: ['neetcode-150', 'blind-75', 'grind-75'], source: 'external', platform: 'leetcode', platformId: '17', externalUrl: 'https://leetcode.com/problems/letter-combinations-of-a-phone-number/', frequencyScore: 8 },
  { slug: 'palindrome-partitioning', title: 'Palindrome Partitioning', difficulty: 'medium', topic: 'Backtracking', topics: ['String', 'Dynamic Programming', 'Backtracking'], companies: ['Amazon', 'Google', 'Microsoft'], sheetTags: ['neetcode-150'], source: 'external', platform: 'leetcode', platformId: '131', externalUrl: 'https://leetcode.com/problems/palindrome-partitioning/', frequencyScore: 7 },
  // Graphs
  { slug: 'clone-graph', title: 'Clone Graph', difficulty: 'medium', topic: 'Graphs', topics: ['Hash Table', 'DFS', 'BFS', 'Graph'], companies: ['Amazon', 'Google', 'Microsoft', 'Meta'], sheetTags: ['neetcode-150', 'blind-75', 'grind-75'], source: 'external', platform: 'leetcode', platformId: '133', externalUrl: 'https://leetcode.com/problems/clone-graph/', frequencyScore: 7 },
  { slug: 'course-schedule', title: 'Course Schedule', difficulty: 'medium', topic: 'Graphs', topics: ['DFS', 'BFS', 'Graph', 'Topological Sort'], companies: ['Amazon', 'Google', 'Microsoft', 'Meta', 'Atlassian'], sheetTags: ['neetcode-150', 'blind-75', 'grind-75', 'striver-sde'], source: 'external', platform: 'leetcode', platformId: '207', externalUrl: 'https://leetcode.com/problems/course-schedule/', frequencyScore: 9 },
  { slug: 'course-schedule-ii', title: 'Course Schedule II', difficulty: 'medium', topic: 'Graphs', topics: ['DFS', 'BFS', 'Graph', 'Topological Sort'], companies: ['Amazon', 'Google', 'Microsoft', 'Meta'], sheetTags: ['neetcode-150', 'blind-75', 'striver-sde'], source: 'external', platform: 'leetcode', platformId: '210', externalUrl: 'https://leetcode.com/problems/course-schedule-ii/', frequencyScore: 8 },
  { slug: 'word-ladder', title: 'Word Ladder', difficulty: 'hard', topic: 'Graphs', topics: ['Hash Table', 'String', 'BFS'], companies: ['Amazon', 'Google', 'Microsoft', 'Meta'], sheetTags: ['neetcode-150', 'blind-75'], source: 'external', platform: 'leetcode', platformId: '127', externalUrl: 'https://leetcode.com/problems/word-ladder/', frequencyScore: 7 },
  { slug: 'pacific-atlantic-water-flow', title: 'Pacific Atlantic Water Flow', difficulty: 'medium', topic: 'Graphs', topics: ['Array', 'DFS', 'BFS', 'Matrix'], companies: ['Amazon', 'Google', 'Microsoft'], sheetTags: ['neetcode-150', 'blind-75'], source: 'external', platform: 'leetcode', platformId: '417', externalUrl: 'https://leetcode.com/problems/pacific-atlantic-water-flow/', frequencyScore: 7 },
  { slug: 'rotting-oranges', title: 'Rotting Oranges', difficulty: 'medium', topic: 'Graphs', topics: ['Array', 'BFS', 'Matrix'], companies: ['Amazon', 'Google', 'Microsoft'], sheetTags: ['neetcode-150', 'grind-75'], source: 'external', platform: 'leetcode', platformId: '994', externalUrl: 'https://leetcode.com/problems/rotting-oranges/', frequencyScore: 7 },
  // DP continued
  { slug: 'house-robber-ii', title: 'House Robber II', difficulty: 'medium', topic: 'Dynamic Programming', topics: ['Array', 'Dynamic Programming'], companies: ['Amazon', 'Google', 'Microsoft'], sheetTags: ['neetcode-150', 'blind-75', 'striver-sde'], source: 'external', platform: 'leetcode', platformId: '213', externalUrl: 'https://leetcode.com/problems/house-robber-ii/', frequencyScore: 8 },
  { slug: 'longest-palindromic-substring', title: 'Longest Palindromic Substring', difficulty: 'medium', topic: 'Dynamic Programming', topics: ['Two Pointers', 'String', 'Dynamic Programming'], companies: ['Amazon', 'Google', 'Microsoft', 'Meta', 'Adobe'], sheetTags: ['neetcode-150', 'blind-75', 'striver-sde'], source: 'external', platform: 'leetcode', platformId: '5', externalUrl: 'https://leetcode.com/problems/longest-palindromic-substring/', frequencyScore: 9 },
  { slug: 'edit-distance', title: 'Edit Distance', difficulty: 'hard', topic: 'Dynamic Programming', topics: ['String', 'Dynamic Programming'], companies: ['Amazon', 'Google', 'Microsoft', 'Meta'], sheetTags: ['neetcode-150', 'blind-75', 'striver-sde'], source: 'external', platform: 'leetcode', platformId: '72', externalUrl: 'https://leetcode.com/problems/edit-distance/', frequencyScore: 8 },
  // Greedy
  { slug: 'gas-station', title: 'Gas Station', difficulty: 'medium', topic: 'Greedy', topics: ['Array', 'Greedy'], companies: ['Amazon', 'Google', 'Microsoft'], sheetTags: ['neetcode-150', 'blind-75'], source: 'external', platform: 'leetcode', platformId: '134', externalUrl: 'https://leetcode.com/problems/gas-station/', frequencyScore: 7 },
  { slug: 'jump-game-ii', title: 'Jump Game II', difficulty: 'medium', topic: 'Greedy', topics: ['Array', 'Dynamic Programming', 'Greedy'], companies: ['Amazon', 'Google', 'Microsoft'], sheetTags: ['neetcode-150', 'grind-75'], source: 'external', platform: 'leetcode', platformId: '45', externalUrl: 'https://leetcode.com/problems/jump-game-ii/', frequencyScore: 7 },
  // Intervals
  { slug: 'insert-interval', title: 'Insert Interval', difficulty: 'medium', topic: 'Arrays', topics: ['Array'], companies: ['Amazon', 'Google', 'Microsoft', 'Meta'], sheetTags: ['neetcode-150', 'blind-75', 'grind-75'], source: 'external', platform: 'leetcode', platformId: '57', externalUrl: 'https://leetcode.com/problems/insert-interval/', frequencyScore: 8 },
  { slug: 'non-overlapping-intervals', title: 'Non Overlapping Intervals', difficulty: 'medium', topic: 'Greedy', topics: ['Array', 'Dynamic Programming', 'Greedy', 'Sorting'], companies: ['Amazon', 'Google', 'Microsoft'], sheetTags: ['neetcode-150', 'blind-75'], source: 'external', platform: 'leetcode', platformId: '435', externalUrl: 'https://leetcode.com/problems/non-overlapping-intervals/', frequencyScore: 7 },
  { slug: 'meeting-rooms', title: 'Meeting Rooms', difficulty: 'easy', topic: 'Arrays', topics: ['Array', 'Sorting'], companies: ['Amazon', 'Google', 'Microsoft', 'Meta'], sheetTags: ['neetcode-150', 'blind-75'], source: 'external', platform: 'leetcode', platformId: '252', externalUrl: 'https://leetcode.com/problems/meeting-rooms/', frequencyScore: 7 },
  { slug: 'meeting-rooms-ii', title: 'Meeting Rooms II', difficulty: 'medium', topic: 'Greedy', topics: ['Array', 'Two Pointers', 'Greedy', 'Sorting', 'Heap'], companies: ['Amazon', 'Google', 'Microsoft', 'Meta'], sheetTags: ['neetcode-150', 'blind-75'], source: 'external', platform: 'leetcode', platformId: '253', externalUrl: 'https://leetcode.com/problems/meeting-rooms-ii/', frequencyScore: 8 },
  // Bit manipulation
  { slug: 'counting-bits', title: 'Counting Bits', difficulty: 'easy', topic: 'Bit Manipulation', topics: ['Dynamic Programming', 'Bit Manipulation'], companies: ['Amazon', 'Google', 'Microsoft'], sheetTags: ['neetcode-150', 'blind-75', 'grind-75'], source: 'external', platform: 'leetcode', platformId: '338', externalUrl: 'https://leetcode.com/problems/counting-bits/', frequencyScore: 7 },
  { slug: 'reverse-bits', title: 'Reverse Bits', difficulty: 'easy', topic: 'Bit Manipulation', topics: ['Divide and Conquer', 'Bit Manipulation'], companies: ['Amazon', 'Google', 'Microsoft'], sheetTags: ['neetcode-150', 'blind-75'], source: 'external', platform: 'leetcode', platformId: '190', externalUrl: 'https://leetcode.com/problems/reverse-bits/', frequencyScore: 6 },
  { slug: 'sum-of-two-integers', title: 'Sum of Two Integers', difficulty: 'medium', topic: 'Bit Manipulation', topics: ['Math', 'Bit Manipulation'], companies: ['Amazon', 'Google', 'Microsoft', 'Meta'], sheetTags: ['neetcode-150', 'blind-75'], source: 'external', platform: 'leetcode', platformId: '371', externalUrl: 'https://leetcode.com/problems/sum-of-two-integers/', frequencyScore: 7 },
  // Group Anagrams, Encode Decode
  { slug: 'group-anagrams', title: 'Group Anagrams', difficulty: 'medium', topic: 'Arrays', topics: ['Array', 'Hash Table', 'String', 'Sorting'], companies: ['Amazon', 'Google', 'Microsoft', 'Meta', 'Adobe'], sheetTags: ['neetcode-150', 'blind-75', 'grind-75', 'striver-sde'], source: 'external', platform: 'leetcode', platformId: '49', externalUrl: 'https://leetcode.com/problems/group-anagrams/', frequencyScore: 9 },
  { slug: 'longest-consecutive-sequence', title: 'Longest Consecutive Sequence', difficulty: 'medium', topic: 'Arrays', topics: ['Array', 'Hash Table', 'Union Find'], companies: ['Amazon', 'Google', 'Microsoft', 'Meta'], sheetTags: ['neetcode-150', 'blind-75', 'striver-sde'], source: 'external', platform: 'leetcode', platformId: '128', externalUrl: 'https://leetcode.com/problems/longest-consecutive-sequence/', frequencyScore: 9 },
  // Sort Colors, Next Permutation
  { slug: 'sort-colors', title: 'Sort Colors', difficulty: 'medium', topic: 'Two Pointers', topics: ['Array', 'Two Pointers', 'Sorting'], companies: ['Amazon', 'Google', 'Microsoft'], sheetTags: ['striver-sde', 'love-babbar'], source: 'external', platform: 'leetcode', platformId: '75', externalUrl: 'https://leetcode.com/problems/sort-colors/', frequencyScore: 7 },
  { slug: 'next-permutation', title: 'Next Permutation', difficulty: 'medium', topic: 'Arrays', topics: ['Array', 'Two Pointers'], companies: ['Amazon', 'Google', 'Microsoft', 'Meta'], sheetTags: ['striver-sde', 'love-babbar'], source: 'external', platform: 'leetcode', platformId: '31', externalUrl: 'https://leetcode.com/problems/next-permutation/', frequencyScore: 8 },
  { slug: 'set-matrix-zeroes', title: 'Set Matrix Zeroes', difficulty: 'medium', topic: 'Arrays', topics: ['Array', 'Hash Table', 'Matrix'], companies: ['Amazon', 'Google', 'Microsoft', 'Meta'], sheetTags: ['neetcode-150', 'striver-sde', 'love-babbar'], source: 'external', platform: 'leetcode', platformId: '73', externalUrl: 'https://leetcode.com/problems/set-matrix-zeroes/', frequencyScore: 7 },
  { slug: 'rotate-image', title: 'Rotate Image', difficulty: 'medium', topic: 'Arrays', topics: ['Array', 'Math', 'Matrix'], companies: ['Amazon', 'Google', 'Microsoft', 'Meta'], sheetTags: ['neetcode-150', 'blind-75', 'striver-sde'], source: 'external', platform: 'leetcode', platformId: '48', externalUrl: 'https://leetcode.com/problems/rotate-image/', frequencyScore: 8 },
  { slug: 'spiral-matrix', title: 'Spiral Matrix', difficulty: 'medium', topic: 'Arrays', topics: ['Array', 'Matrix', 'Simulation'], companies: ['Amazon', 'Google', 'Microsoft', 'Meta', 'Adobe'], sheetTags: ['neetcode-150', 'striver-sde', 'love-babbar'], source: 'external', platform: 'leetcode', platformId: '54', externalUrl: 'https://leetcode.com/problems/spiral-matrix/', frequencyScore: 8 },
  // More DP
  { slug: 'palindromic-substrings', title: 'Palindromic Substrings', difficulty: 'medium', topic: 'Dynamic Programming', topics: ['Two Pointers', 'String', 'Dynamic Programming'], companies: ['Amazon', 'Google', 'Microsoft'], sheetTags: ['neetcode-150', 'blind-75'], source: 'external', platform: 'leetcode', platformId: '647', externalUrl: 'https://leetcode.com/problems/palindromic-substrings/', frequencyScore: 7 },
  { slug: 'burst-balloons', title: 'Burst Balloons', difficulty: 'hard', topic: 'Dynamic Programming', topics: ['Array', 'Dynamic Programming'], companies: ['Amazon', 'Google', 'Microsoft'], sheetTags: ['neetcode-150'], source: 'external', platform: 'leetcode', platformId: '312', externalUrl: 'https://leetcode.com/problems/burst-balloons/', frequencyScore: 6 },
  { slug: 'regular-expression-matching', title: 'Regular Expression Matching', difficulty: 'hard', topic: 'Dynamic Programming', topics: ['String', 'Dynamic Programming', 'Recursion'], companies: ['Amazon', 'Google', 'Microsoft', 'Meta'], sheetTags: ['neetcode-150', 'blind-75'], source: 'external', platform: 'leetcode', platformId: '10', externalUrl: 'https://leetcode.com/problems/regular-expression-matching/', frequencyScore: 7 },
  // Apna College / Love Babbar specific
  { slug: 'kadanes-algorithm', title: "Kadane's Algorithm", difficulty: 'easy', topic: 'Dynamic Programming', topics: ['Array', 'Dynamic Programming', 'Divide and Conquer'], companies: ['Amazon', 'Google', 'Microsoft'], sheetTags: ['love-babbar', 'apna-college'], source: 'external', platform: 'gfg', externalUrl: 'https://www.geeksforgeeks.org/largest-sum-contiguous-subarray/', frequencyScore: 8 },
  { slug: 'detect-cycle-in-linked-list', title: 'Detect Cycle in Linked List', difficulty: 'easy', topic: 'Linked List', topics: ['Linked List', 'Two Pointers'], companies: ['Amazon', 'Google', 'Microsoft'], sheetTags: ['striver-sde', 'love-babbar', 'apna-college'], source: 'external', platform: 'leetcode', platformId: '141', externalUrl: 'https://leetcode.com/problems/linked-list-cycle/', frequencyScore: 7 },
  { slug: 'preorder-inorder-postorder', title: 'Binary Tree Traversals', difficulty: 'easy', topic: 'Trees', topics: ['Tree', 'DFS', 'Binary Tree'], companies: ['Amazon', 'Google', 'Microsoft'], sheetTags: ['striver-sde', 'love-babbar', 'apna-college'], source: 'external', platform: 'gfg', externalUrl: 'https://www.geeksforgeeks.org/tree-traversals-inorder-preorder-and-postorder/', frequencyScore: 7 },
  { slug: 'matrix-chain-multiplication', title: 'Matrix Chain Multiplication', difficulty: 'hard', topic: 'Dynamic Programming', topics: ['Dynamic Programming'], companies: ['Amazon', 'Google', 'Morgan Stanley', 'Goldman Sachs'], sheetTags: ['love-babbar', 'apna-college'], source: 'external', platform: 'gfg', externalUrl: 'https://www.geeksforgeeks.org/matrix-chain-multiplication-dp-8/', frequencyScore: 7 },
  { slug: 'activity-selection', title: 'Activity Selection Problem', difficulty: 'medium', topic: 'Greedy', topics: ['Greedy', 'Sorting'], companies: ['Amazon', 'Google', 'Microsoft'], sheetTags: ['love-babbar', 'apna-college'], source: 'external', platform: 'gfg', externalUrl: 'https://www.geeksforgeeks.org/activity-selection-problem-greedy-algo-1/', frequencyScore: 7 },
  { slug: 'fractional-knapsack', title: 'Fractional Knapsack', difficulty: 'medium', topic: 'Greedy', topics: ['Greedy', 'Sorting'], companies: ['Amazon', 'Microsoft', 'Goldman Sachs'], sheetTags: ['love-babbar', 'apna-college'], source: 'external', platform: 'gfg', externalUrl: 'https://www.geeksforgeeks.org/fractional-knapsack-problem/', frequencyScore: 7 },
  { slug: '01-knapsack', title: '0/1 Knapsack Problem', difficulty: 'medium', topic: 'Dynamic Programming', topics: ['Dynamic Programming'], companies: ['Amazon', 'Google', 'Microsoft', 'Goldman Sachs', 'Morgan Stanley'], sheetTags: ['striver-sde', 'love-babbar', 'apna-college'], source: 'external', platform: 'gfg', externalUrl: 'https://www.geeksforgeeks.org/0-1-knapsack-problem-dp-10/', frequencyScore: 9 },
  { slug: 'lca-binary-tree', title: 'Lowest Common Ancestor of Binary Tree', difficulty: 'medium', topic: 'Trees', topics: ['Tree', 'DFS', 'Binary Tree'], companies: ['Amazon', 'Google', 'Microsoft', 'Meta', 'Atlassian'], sheetTags: ['striver-sde', 'love-babbar', 'apna-college'], source: 'external', platform: 'leetcode', platformId: '236', externalUrl: 'https://leetcode.com/problems/lowest-common-ancestor-of-a-binary-tree/', frequencyScore: 8 },
  { slug: 'dijkstra-algorithm', title: "Dijkstra's Algorithm", difficulty: 'medium', topic: 'Graphs', topics: ['Graph', 'Heap', 'Shortest Path'], companies: ['Amazon', 'Google', 'Microsoft', 'Uber', 'Goldman Sachs'], sheetTags: ['striver-sde', 'love-babbar', 'apna-college'], source: 'external', platform: 'gfg', externalUrl: 'https://www.geeksforgeeks.org/dijkstras-shortest-path-algorithm-greedy-algo-7/', frequencyScore: 8 },
  { slug: 'topological-sort', title: 'Topological Sort', difficulty: 'medium', topic: 'Graphs', topics: ['Graph', 'DFS', 'Topological Sort'], companies: ['Amazon', 'Google', 'Microsoft', 'Atlassian'], sheetTags: ['striver-sde', 'love-babbar', 'apna-college'], source: 'external', platform: 'gfg', externalUrl: 'https://www.geeksforgeeks.org/topological-sorting/', frequencyScore: 8 },
  { slug: 'network-delay-time', title: 'Network Delay Time', difficulty: 'medium', topic: 'Graphs', topics: ['DFS', 'BFS', 'Graph', 'Heap', 'Shortest Path'], companies: ['Amazon', 'Google', 'Microsoft', 'Uber'], sheetTags: ['neetcode-150'], source: 'external', platform: 'leetcode', platformId: '743', externalUrl: 'https://leetcode.com/problems/network-delay-time/', frequencyScore: 7 },
  { slug: 'cheapest-flights-within-k-stops', title: 'Cheapest Flights Within K Stops', difficulty: 'medium', topic: 'Graphs', topics: ['Dynamic Programming', 'DFS', 'BFS', 'Graph', 'Heap', 'Shortest Path'], companies: ['Amazon', 'Google', 'Uber'], sheetTags: ['neetcode-150'], source: 'external', platform: 'leetcode', platformId: '787', externalUrl: 'https://leetcode.com/problems/cheapest-flights-within-k-stops/', frequencyScore: 7 },
];

// ── DSA Sheets ─────────────────────────────────────────────────────────────────
const SHEETS = [
  {
    name: 'NeetCode 150', slug: 'neetcode-150', author: 'NeetCode',
    description: '150 curated problems covering all major DSA topics, hand-picked for FAANG interviews.', color: '#6366f1',
    difficulty: 'mixed', icon: '🎯',
    categories: [
      { name: 'Arrays & Hashing', order: 1, problemSlugs: ['contains-duplicate', 'valid-anagram', 'two-sum', 'group-anagrams', 'top-k-frequent-elements', 'product-of-array-except-self', 'longest-consecutive-sequence', 'set-matrix-zeroes', 'spiral-matrix', 'rotate-image'] },
      { name: 'Two Pointers', order: 2, problemSlugs: ['valid-palindrome', 'two-sum-ii', 'three-sum', 'container-with-most-water', 'trapping-rain-water'] },
      { name: 'Sliding Window', order: 3, problemSlugs: ['best-time-to-buy-and-sell-stock', 'longest-substring-without-repeating', 'longest-repeating-character-replacement', 'minimum-window-substring'] },
      { name: 'Stack', order: 4, problemSlugs: ['valid-parentheses', 'min-stack', 'daily-temperatures', 'generate-parentheses', 'largest-rectangle-in-histogram'] },
      { name: 'Binary Search', order: 5, problemSlugs: ['binary-search', 'find-minimum-in-rotated-sorted-array', 'search-in-rotated-sorted-array', 'sqrt-x'] },
      { name: 'Linked List', order: 6, problemSlugs: ['reverse-linked-list', 'merge-two-sorted-lists', 'linked-list-cycle', 'reorder-list', 'remove-nth-node-from-end', 'lru-cache', 'merge-k-sorted-lists'] },
      { name: 'Trees', order: 7, problemSlugs: ['invert-binary-tree', 'maximum-depth-binary-tree', 'same-tree', 'lowest-common-ancestor-bst', 'binary-tree-level-order-traversal', 'validate-bst', 'kth-smallest-in-bst', 'construct-binary-tree-preorder-inorder', 'binary-tree-max-path-sum', 'serialize-deserialize-binary-tree'] },
      { name: 'Tries', order: 8, problemSlugs: ['implement-trie'] },
      { name: 'Heap / Priority Queue', order: 9, problemSlugs: ['kth-largest-element-in-array', 'top-k-frequent-elements', 'k-closest-points-to-origin', 'task-scheduler', 'find-median-from-data-stream'] },
      { name: 'Backtracking', order: 10, problemSlugs: ['subsets', 'combination-sum', 'permutations', 'letter-combinations-phone', 'palindrome-partitioning', 'word-search', 'generate-parentheses'] },
      { name: 'Graphs', order: 11, problemSlugs: ['number-of-islands', 'max-area-of-island', 'clone-graph', 'course-schedule', 'course-schedule-ii', 'pacific-atlantic-water-flow', 'rotting-oranges', 'word-ladder', 'network-delay-time', 'cheapest-flights-within-k-stops'] },
      { name: 'Dynamic Programming', order: 12, problemSlugs: ['climbing-stairs', 'house-robber', 'house-robber-ii', 'longest-palindromic-substring', 'palindromic-substrings', 'decode-ways', 'coin-change', 'maximum-subarray', 'maximum-product-subarray', 'word-break', 'longest-increasing-subsequence', 'partition-equal-subset-sum', 'unique-paths', 'longest-common-subsequence', 'edit-distance', 'burst-balloons', 'regular-expression-matching', 'jump-game', 'jump-game-ii'] },
      { name: 'Greedy', order: 13, problemSlugs: ['maximum-subarray', 'jump-game', 'jump-game-ii', 'gas-station', 'meeting-rooms', 'meeting-rooms-ii', 'non-overlapping-intervals'] },
      { name: 'Intervals', order: 14, problemSlugs: ['merge-intervals', 'insert-interval', 'non-overlapping-intervals', 'meeting-rooms', 'meeting-rooms-ii'] },
      { name: 'Bit Manipulation', order: 15, problemSlugs: ['single-number', 'missing-number', 'number-of-1-bits', 'counting-bits', 'reverse-bits', 'sum-of-two-integers', 'power-of-two'] },
    ],
  },
  {
    name: 'Blind 75', slug: 'blind-75', author: 'Blind Community',
    description: 'The famous list of 75 essential LeetCode problems curated from the Blind community. A must-do for any FAANG aspirant.', color: '#f59e0b',
    difficulty: 'mixed', icon: '🔥',
    categories: [
      { name: 'Array', order: 1, problemSlugs: ['two-sum', 'best-time-to-buy-and-sell-stock', 'contains-duplicate', 'product-of-array-except-self', 'maximum-subarray', 'maximum-product-subarray', 'find-minimum-in-rotated-sorted-array', 'search-in-rotated-sorted-array', 'three-sum', 'container-with-most-water'] },
      { name: 'Binary', order: 2, problemSlugs: ['sum-of-two-integers', 'number-of-1-bits', 'counting-bits', 'missing-number', 'reverse-bits', 'single-number'] },
      { name: 'Dynamic Programming', order: 3, problemSlugs: ['climbing-stairs', 'coin-change', 'longest-increasing-subsequence', 'longest-common-subsequence', 'word-break', 'combination-sum', 'house-robber', 'house-robber-ii', 'decode-ways', 'unique-paths', 'jump-game'] },
      { name: 'Graph', order: 4, problemSlugs: ['clone-graph', 'course-schedule', 'pacific-atlantic-water-flow', 'number-of-islands', 'longest-consecutive-sequence'] },
      { name: 'Interval', order: 5, problemSlugs: ['insert-interval', 'merge-intervals', 'non-overlapping-intervals', 'meeting-rooms', 'meeting-rooms-ii'] },
      { name: 'Linked List', order: 6, problemSlugs: ['reverse-linked-list', 'detect-cycle-in-linked-list', 'merge-two-sorted-lists', 'merge-k-sorted-lists', 'remove-nth-node-from-end', 'reorder-list'] },
      { name: 'Matrix', order: 7, problemSlugs: ['set-matrix-zeroes', 'spiral-matrix', 'rotate-image', 'word-search'] },
      { name: 'String', order: 8, problemSlugs: ['longest-substring-without-repeating', 'longest-repeating-character-replacement', 'minimum-window-substring', 'valid-anagram', 'group-anagrams', 'valid-palindrome', 'longest-palindromic-substring', 'palindromic-substrings', 'decode-ways'] },
      { name: 'Tree', order: 9, problemSlugs: ['maximum-depth-binary-tree', 'same-tree', 'invert-binary-tree', 'binary-tree-max-path-sum', 'binary-tree-level-order-traversal', 'serialize-deserialize-binary-tree', 'validate-bst', 'kth-smallest-in-bst', 'lowest-common-ancestor-bst', 'construct-binary-tree-preorder-inorder'] },
      { name: 'Heap', order: 10, problemSlugs: ['top-k-frequent-elements', 'find-median-from-data-stream', 'k-closest-points-to-origin', 'task-scheduler'] },
      { name: 'Trie', order: 11, problemSlugs: ['implement-trie'] },
    ],
  },
  {
    name: 'Grind 75', slug: 'grind-75', author: 'yangshun',
    description: 'A study plan for 75 days of LeetCode grinding, generated based on the original Blind 75 with a structured schedule.', color: '#10b981',
    difficulty: 'mixed', icon: '💪',
    categories: [
      { name: 'Week 1 — Arrays & Strings', order: 1, problemSlugs: ['two-sum', 'valid-parentheses', 'merge-two-sorted-lists', 'best-time-to-buy-and-sell-stock', 'valid-palindrome', 'valid-anagram', 'binary-search', 'single-number', 'majority-element', 'move-zeroes'] },
      { name: 'Week 2 — Linked List & Trees', order: 2, problemSlugs: ['reverse-linked-list', 'linked-list-cycle', 'maximum-depth-binary-tree', 'invert-binary-tree', 'lowest-common-ancestor-bst', 'missing-number', 'sqrt-x'] },
      { name: 'Week 3 — Two Pointers & Binary Search', order: 3, problemSlugs: ['three-sum', 'container-with-most-water', 'find-minimum-in-rotated-sorted-array', 'search-in-rotated-sorted-array', 'product-of-array-except-self'] },
      { name: 'Week 4 — BFS/DFS & Stack', order: 4, problemSlugs: ['binary-tree-level-order-traversal', 'clone-graph', 'number-of-islands', 'rotting-oranges', 'min-stack', 'daily-temperatures'] },
      { name: 'Week 5 — Backtracking & Heap', order: 5, problemSlugs: ['combination-sum', 'permutations', 'letter-combinations-phone', 'subsets', 'generate-parentheses', 'k-closest-points-to-origin', 'kth-largest-element-in-array', 'top-k-frequent-elements'] },
      { name: 'Week 6 — Dynamic Programming', order: 6, problemSlugs: ['climbing-stairs', 'coin-change', 'jump-game', 'jump-game-ii', 'unique-paths', 'house-robber', 'maximum-subarray', 'word-break', 'course-schedule'] },
      { name: 'Week 7 — Advanced', order: 7, problemSlugs: ['merge-intervals', 'insert-interval', 'longest-increasing-subsequence', 'longest-common-subsequence', 'group-anagrams', 'longest-consecutive-sequence', 'longest-substring-without-repeating'] },
    ],
  },
  {
    name: 'Striver SDE Sheet', slug: 'striver-sde', author: 'Striver (TUF)',
    description: "Striver's SDE Sheet with 180+ must-do problems for Software Development Engineer interviews at top product companies.", color: '#ef4444',
    difficulty: 'mixed', icon: '⚡',
    categories: [
      { name: 'Day 1: Arrays - I', order: 1, problemSlugs: ['sort-colors', 'next-permutation', 'maximum-subarray', 'best-time-to-buy-and-sell-stock', 'rotate-image'] },
      { name: 'Day 2: Arrays - II', order: 2, problemSlugs: ['merge-intervals', 'merge-two-sorted-lists', 'find-duplicate-number', 'majority-element', 'unique-paths'] },
      { name: 'Day 3: Arrays - III', order: 3, problemSlugs: ['search-in-rotated-sorted-array', 'find-minimum-in-rotated-sorted-array', 'product-of-array-except-self', 'top-k-frequent-elements', 'spiral-matrix'] },
      { name: 'Day 4: Arrays - IV (2D)', order: 4, problemSlugs: ['set-matrix-zeroes', 'rotate-image', 'spiral-matrix', 'word-search'] },
      { name: 'Day 5: Linked List - I', order: 5, problemSlugs: ['reverse-linked-list', 'linked-list-cycle', 'merge-two-sorted-lists', 'remove-nth-node-from-end', 'detect-cycle-in-linked-list'] },
      { name: 'Day 6: Linked List - II', order: 6, problemSlugs: ['lru-cache', 'reorder-list', 'merge-k-sorted-lists'] },
      { name: 'Day 7: Greedy', order: 7, problemSlugs: ['maximum-subarray', 'jump-game', 'jump-game-ii', 'gas-station', 'fractional-knapsack', 'activity-selection', 'meeting-rooms-ii'] },
      { name: 'Day 8-9: Recursion & Backtracking', order: 8, problemSlugs: ['subsets', 'combination-sum', 'permutations', 'letter-combinations-phone', 'word-search', 'palindrome-partitioning'] },
      { name: 'Day 10-11: Binary Search', order: 9, problemSlugs: ['binary-search', 'search-in-rotated-sorted-array', 'find-minimum-in-rotated-sorted-array', 'kth-largest-element-in-array', 'median-of-two-sorted-arrays'] },
      { name: 'Day 12: Heap', order: 10, problemSlugs: ['top-k-frequent-elements', 'kth-largest-element-in-array', 'find-median-from-data-stream', 'task-scheduler', 'merge-k-sorted-lists'] },
      { name: 'Day 13-14: Stack & Queue', order: 11, problemSlugs: ['valid-parentheses', 'min-stack', 'daily-temperatures', 'largest-rectangle-in-histogram', 'generate-parentheses'] },
      { name: 'Day 15-16: Trees', order: 12, problemSlugs: ['invert-binary-tree', 'maximum-depth-binary-tree', 'binary-tree-level-order-traversal', 'validate-bst', 'kth-smallest-in-bst', 'lowest-common-ancestor-bst', 'construct-binary-tree-preorder-inorder', 'binary-tree-max-path-sum', 'serialize-deserialize-binary-tree', 'preorder-inorder-postorder', 'lca-binary-tree'] },
      { name: 'Day 17-18: Graphs', order: 13, problemSlugs: ['number-of-islands', 'clone-graph', 'course-schedule', 'course-schedule-ii', 'topological-sort', 'dijkstra-algorithm', 'rotting-oranges'] },
      { name: 'Day 19-20: Dynamic Programming', order: 14, problemSlugs: ['climbing-stairs', 'house-robber', 'house-robber-ii', 'longest-increasing-subsequence', 'longest-common-subsequence', 'coin-change', '01-knapsack', 'word-break', 'edit-distance', 'partition-equal-subset-sum', 'maximum-product-subarray', 'matrix-chain-multiplication'] },
      { name: 'Day 21-22: Trie & Misc', order: 15, problemSlugs: ['implement-trie', 'group-anagrams', 'longest-consecutive-sequence', 'valid-anagram', 'decode-ways'] },
    ],
  },
  {
    name: 'Love Babbar 450', slug: 'love-babbar', author: 'Love Babbar',
    description: "Love Babbar's famous 450 DSA questions sheet covering all important DSA topics for campus placements.", color: '#8b5cf6',
    difficulty: 'mixed', icon: '📚',
    categories: [
      { name: 'Arrays', order: 1, problemSlugs: ['two-sum', 'best-time-to-buy-and-sell-stock', 'maximum-subarray', 'contains-duplicate', 'product-of-array-except-self', 'merge-intervals', 'sort-colors', 'next-permutation', 'majority-element', 'set-matrix-zeroes', 'spiral-matrix', 'rotate-image', 'maximum-product-subarray', 'merge-intervals', 'kadanes-algorithm'] },
      { name: 'Strings', order: 2, problemSlugs: ['valid-anagram', 'valid-palindrome', 'group-anagrams', 'longest-substring-without-repeating', 'longest-palindromic-substring', 'decode-ways'] },
      { name: 'Linked List', order: 3, problemSlugs: ['reverse-linked-list', 'merge-two-sorted-lists', 'linked-list-cycle', 'detect-cycle-in-linked-list', 'remove-nth-node-from-end', 'merge-k-sorted-lists', 'reorder-list', 'lru-cache'] },
      { name: 'Stack & Queue', order: 4, problemSlugs: ['valid-parentheses', 'min-stack', 'daily-temperatures', 'generate-parentheses', 'largest-rectangle-in-histogram'] },
      { name: 'Trees', order: 5, problemSlugs: ['invert-binary-tree', 'maximum-depth-binary-tree', 'same-tree', 'binary-tree-level-order-traversal', 'validate-bst', 'lowest-common-ancestor-bst', 'kth-smallest-in-bst', 'binary-tree-max-path-sum', 'serialize-deserialize-binary-tree', 'lca-binary-tree', 'preorder-inorder-postorder'] },
      { name: 'Binary Search', order: 6, problemSlugs: ['binary-search', 'search-in-rotated-sorted-array', 'find-minimum-in-rotated-sorted-array', 'sqrt-x', 'kth-largest-element-in-array'] },
      { name: 'Greedy', order: 7, problemSlugs: ['jump-game', 'jump-game-ii', 'gas-station', 'best-time-to-buy-and-sell-stock', 'activity-selection', 'fractional-knapsack', 'meeting-rooms', 'meeting-rooms-ii'] },
      { name: 'Backtracking', order: 8, problemSlugs: ['subsets', 'combination-sum', 'permutations', 'word-search', 'letter-combinations-phone', 'palindrome-partitioning'] },
      { name: 'Dynamic Programming', order: 9, problemSlugs: ['climbing-stairs', 'fibonacci-number', 'house-robber', 'coin-change', 'longest-increasing-subsequence', 'longest-common-subsequence', 'word-break', 'edit-distance', 'partition-equal-subset-sum', '01-knapsack', 'unique-paths', 'matrix-chain-multiplication', 'maximum-product-subarray', 'decode-ways'] },
      { name: 'Graphs', order: 10, problemSlugs: ['number-of-islands', 'course-schedule', 'course-schedule-ii', 'rotting-oranges', 'topological-sort', 'dijkstra-algorithm', 'network-delay-time'] },
      { name: 'Bit Manipulation', order: 11, problemSlugs: ['single-number', 'missing-number', 'number-of-1-bits', 'counting-bits', 'power-of-two'] },
    ],
  },
  {
    name: 'Apna College Roadmap', slug: 'apna-college', author: 'Apna College',
    description: 'Structured DSA learning roadmap from Apna College — perfect for beginners to intermediate learners preparing for campus placements.', color: '#06b6d4',
    difficulty: 'beginner', icon: '🏫',
    categories: [
      { name: 'Module 1: Basics & Arrays', order: 1, problemSlugs: ['two-sum', 'contains-duplicate', 'maximum-subarray', 'majority-element', 'move-zeroes', 'best-time-to-buy-and-sell-stock', 'kadanes-algorithm', 'fibonacci-number'] },
      { name: 'Module 2: Sorting & Searching', order: 2, problemSlugs: ['binary-search', 'sort-colors', 'sqrt-x', 'merge-intervals'] },
      { name: 'Module 3: Strings', order: 3, problemSlugs: ['valid-palindrome', 'valid-anagram', 'longest-substring-without-repeating', 'group-anagrams'] },
      { name: 'Module 4: Recursion & Backtracking', order: 4, problemSlugs: ['climbing-stairs', 'fibonacci-number', 'subsets', 'permutations', 'combination-sum', 'letter-combinations-phone'] },
      { name: 'Module 5: Linked Lists', order: 5, problemSlugs: ['reverse-linked-list', 'detect-cycle-in-linked-list', 'merge-two-sorted-lists', 'linked-list-cycle'] },
      { name: 'Module 6: Stack & Queue', order: 6, problemSlugs: ['valid-parentheses', 'min-stack', 'generate-parentheses', 'daily-temperatures'] },
      { name: 'Module 7: Trees', order: 7, problemSlugs: ['maximum-depth-binary-tree', 'invert-binary-tree', 'binary-tree-level-order-traversal', 'validate-bst', 'preorder-inorder-postorder'] },
      { name: 'Module 8: Graphs', order: 8, problemSlugs: ['number-of-islands', 'course-schedule', 'rotting-oranges', 'topological-sort', 'dijkstra-algorithm'] },
      { name: 'Module 9: Dynamic Programming', order: 9, problemSlugs: ['climbing-stairs', 'house-robber', 'coin-change', 'longest-increasing-subsequence', '01-knapsack', 'matrix-chain-multiplication', 'unique-paths', 'word-break'] },
      { name: 'Module 10: Greedy & Misc', order: 10, problemSlugs: ['jump-game', 'activity-selection', 'fractional-knapsack', 'single-number', 'missing-number', 'power-of-two', 'number-of-1-bits'] },
    ],
  },
];

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  let addedProblems = 0, updatedProblems = 0;

  // Seed internal problems
  for (const p of INTERNAL) {
    const result = await CodingProblem.updateOne(
      { slug: p.slug },
      { $setOnInsert: p },
      { upsert: true }
    );
    if (result.upsertedCount) addedProblems++;
    else {
      // Update metadata on existing problems
      await CodingProblem.updateOne({ slug: p.slug }, {
        $set: {
          companies: p.companies, sheetTags: p.sheetTags, roadmapTags: p.roadmapTags,
          frequencyScore: p.frequencyScore, topics: p.topics,
          hints: p.hints, externalUrl: p.externalUrl, platform: p.platform, platformId: p.platformId,
        },
      });
      updatedProblems++;
    }
  }

  // Seed external problems
  for (const p of EXTERNAL) {
    const doc = {
      ...p,
      description: p.description || `${p.title} — See the problem on ${p.platform === 'leetcode' ? 'LeetCode' : 'GeeksforGeeks'}.`,
      isActive: true,
    };
    const result = await CodingProblem.updateOne(
      { slug: p.slug },
      { $setOnInsert: doc },
      { upsert: true }
    );
    if (result.upsertedCount) addedProblems++;
    else updatedProblems++;
  }

  // Update the 6 original problems (seeded by server.js) with metadata by title
  const titleMetaMap = {
    'Two Sum':            { slug: 'two-sum' },
    'Valid Parentheses':  { slug: 'valid-parentheses' },
    'Reverse Linked List':{ slug: 'reverse-linked-list' },
    'Longest Common Subsequence': { slug: 'longest-common-subsequence' },
    'Binary Search':      { slug: 'binary-search' },
    'Maximum Subarray':   { slug: 'maximum-subarray' },
  };
  for (const [title, meta] of Object.entries(titleMetaMap)) {
    await CodingProblem.updateOne({ title, slug: { $exists: false } }, { $set: meta });
  }

  console.log(`Problems: +${addedProblems} added, ~${updatedProblems} updated`);

  // Seed DSA sheets
  let addedSheets = 0;
  for (const sheet of SHEETS) {
    // Compute totalProblems from unique slugs
    const allSlugs = new Set(sheet.categories.flatMap(c => c.problemSlugs));
    const existingCount = await CodingProblem.countDocuments({ slug: { $in: [...allSlugs] } });
    const sheetDoc = { ...sheet, totalProblems: allSlugs.size };

    const result = await DSASheet.updateOne(
      { slug: sheet.slug },
      { $set: sheetDoc },
      { upsert: true }
    );
    if (result.upsertedCount) addedSheets++;
  }
  console.log(`Sheets: +${addedSheets} seeded (${SHEETS.length - addedSheets} already existed)`);

  await mongoose.disconnect();
  console.log('Done!');
}

seed().catch(err => { console.error('Seed failed:', err.message); process.exit(1); });
