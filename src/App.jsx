import { useState, useEffect, useRef, useCallback } from "react";
import { PlusCircle, X, ChevronLeft, ChevronRight, Search, Trash2, TrendingUp, PieChart, List, BarChart2, CheckCircle, Upload, FileSpreadsheet } from "lucide-react";
import { AreaChart, Area, BarChart, Bar, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart as RePieChart, Pie } from "recharts";
import * as XLSX from "xlsx";

const SUPABASE_URL = "https://qezlyqnwrulwdjxydjml.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFlemx5cW53cnVsd2RqeHlkam1sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4NTc4MjQsImV4cCI6MjA4OTQzMzgyNH0.ISWoPma2qGNSzmp52l07FbWyI-2v6iI3fXyb_nWNC-s";

const db = {
  async getAll() {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/transactions?select=*&order=date.desc`, {
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }
    });
    if(!r.ok){ console.error("Supabase fetch failed:", r.status, await r.text()); return []; }
    const rows = await r.json();
    // Map "description" column back to "desc" for the app
    return rows.map(r=>({...r, desc: r.description||r.desc}));
  },
  async upsert(rows) {
    // Map "desc" to "description" for Supabase
    const mapped = rows.map(r=>({id:r.id,date:r.date,description:r.desc,amount:r.amount,cat:r.cat,type:r.type}));
    const res = await fetch(`${SUPABASE_URL}/rest/v1/transactions`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates",
      },
      body: JSON.stringify(mapped),
    });
    if(!res.ok) console.error("Supabase upsert failed:", res.status, await res.text());
  },
  async remove(id) {
    await fetch(`${SUPABASE_URL}/rest/v1/transactions?id=eq.${id}`, {
      method: "DELETE",
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }
    });
  },
};

const BUDGET = {
  "Housing & Utilities":2690,"Food":1750,"Shopping & Subscription":1250,
  "Transportation":600,"Personal Care":500,"Entertainment":500,
  "Education Expense":500,"Tithe, Charity, & Gifts":450,
  "Housewares and furnishings":400,"Kid's":200,"Miscellaneous":160,
};
const CATEGORIES = Object.keys(BUDGET);
const INCOME_CATS = ["CNB","VA","Theater","Other Income"];
const CAT_COLORS = {
  "Housing & Utilities":"#2563EB","Food":"#DC2626","Shopping & Subscription":"#D97706",
  "Transportation":"#0891B2","Personal Care":"#DB2777","Entertainment":"#7C3AED",
  "Education Expense":"#059669","Tithe, Charity, & Gifts":"#EA580C",
  "Housewares and furnishings":"#0D9488","Kid's":"#E11D48","Miscellaneous":"#6B7280",
};
const CAT_EMOJI = {
  "Housing & Utilities":"🏠","Food":"🍔","Shopping & Subscription":"🛍️",
  "Transportation":"🚗","Personal Care":"💆","Entertainment":"🎉",
  "Education Expense":"📚","Tithe, Charity, & Gifts":"🙏",
  "Housewares and furnishings":"🛋️","Kid's":"👶","Miscellaneous":"📦",
};
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

const SEED = [
  {id:"s001",date:"2026-01-01",desc:'ST ANDREWS EPISCOPAL CHUR',amount:410.0,cat:'Education Expense',type:"expense"},
  {id:"s002",date:"2026-01-01",desc:'FPL DIRECT DEBIT',amount:150.84,cat:'Housing & Utilities',type:"expense"},
  {id:"s003",date:"2026-01-02",desc:'KAREN KENNEDY',amount:150.0,cat:'Kid\'s',type:"expense"},
  {id:"s004",date:"2026-01-02",desc:'PENNYMAC',amount:1538.31,cat:'Housing & Utilities',type:"expense"},
  {id:"s005",date:"2026-01-02",desc:'NFCU ACH',amount:300.84,cat:'Transportation',type:"expense"},
  {id:"s006",date:"2026-01-02",desc:'CHRIST FELLOWSHI',amount:100.0,cat:'Tithe, Charity, & Gifts',type:"expense"},
  {id:"s007",date:"2026-01-02",desc:'WALGREENS #4808',amount:141.26,cat:'Personal Care',type:"expense"},
  {id:"s008",date:"2026-01-02",desc:'www.bubbi.app',amount:35.0,cat:'Shopping & Subscription',type:"expense"},
  {id:"s009",date:"2026-01-02",desc:'CENTRAL MISSIONARY CLEARI',amount:205.75,cat:'Tithe, Charity, & Gifts',type:"expense"},
  {id:"s010",date:"2026-01-02",desc:'AMAZON MKTPL*FB0JE1VZ3',amount:32.07,cat:'Personal Care',type:"expense"},
  {id:"s011",date:"2026-01-02",desc:'Microsoft*Microsoft 365 F',amount:12.99,cat:'Shopping & Subscription',type:"expense"},
  {id:"s012",date:"2026-01-04",desc:'WALMART.COM',amount:53.91,cat:'Kid\'s',type:"expense"},
  {id:"s013",date:"2026-01-04",desc:'Roku for CBS Interactive',amount:7.99,cat:'Shopping & Subscription',type:"expense"},
  {id:"s014",date:"2026-01-05",desc:'MDWS',amount:167.22,cat:'Housing & Utilities',type:"expense"},
  {id:"s015",date:"2026-01-05",desc:'Club La Costa Ho',amount:70.5,cat:'Housing & Utilities',type:"expense"},
  {id:"s016",date:"2026-01-05",desc:'BANNER LIFE',amount:16.79,cat:'Shopping & Subscription',type:"expense"},
  {id:"s017",date:"2026-01-05",desc:'ROSS STORES #2040',amount:18.17,cat:'Shopping & Subscription',type:"expense"},
  {id:"s018",date:"2026-01-05",desc:'AMAZON MKTPL*2G8Z55W93',amount:32.09,cat:'Housewares and furnishings',type:"expense"},
  {id:"s019",date:"2026-01-05",desc:'SQ *GET BROWS',amount:16.0,cat:'Personal Care',type:"expense"},
  {id:"s020",date:"2026-01-05",desc:'Roku for Peacock TV LLC',amount:10.99,cat:'Shopping & Subscription',type:"expense"},
  {id:"s021",date:"2026-01-05",desc:'THRIFT BOOKS GLOBAL  LLC',amount:16.42,cat:'Shopping & Subscription',type:"expense"},
  {id:"s022",date:"2026-01-05",desc:'UBER   *EATS',amount:11.08,cat:'Food',type:"expense"},
  {id:"s023",date:"2026-01-05",desc:'GOODWILL - PALMETTO BAY',amount:5.34,cat:'Shopping & Subscription',type:"expense"},
  {id:"s024",date:"2026-01-05",desc:'WALMART.COM',amount:229.24,cat:'Food',type:"expense"},
  {id:"s025",date:"2026-01-05",desc:'DNA FITNESS',amount:159.0,cat:'Personal Care',type:"expense"},
  {id:"s026",date:"2026-01-05",desc:'WALMART.COM',amount:467.28,cat:'Entertainment',type:"expense"},
  {id:"s027",date:"2026-01-05",desc:'CANVA* I04752-9555930',amount:14.99,cat:'Shopping & Subscription',type:"expense"},
  {id:"s028",date:"2026-01-06",desc:'UM MY CHART BILLING',amount:30.0,cat:'Personal Care',type:"expense"},
  {id:"s029",date:"2026-01-06",desc:'WALGREENS #4808',amount:-31.99,cat:'Personal Care',type:"expense"},
  {id:"s030",date:"2026-01-06",desc:'7-ELEVEN 37548',amount:47.05,cat:'Transportation',type:"expense"},
  {id:"s031",date:"2026-01-06",desc:'STAPLES       00117788',amount:2.31,cat:'Shopping & Subscription',type:"expense"},
  {id:"s032",date:"2026-01-06",desc:'AMAZON MKTPL*DJ2ZJ70O3',amount:169.95,cat:'Entertainment',type:"expense"},
  {id:"s033",date:"2026-01-06",desc:'IC* INSTACART*159',amount:285.44,cat:'Food',type:"expense"},
  {id:"s034",date:"2026-01-06",desc:'CRICUT',amount:9.99,cat:'Shopping & Subscription',type:"expense"},
  {id:"s035",date:"2026-01-06",desc:'CHIPOTLE MEX GR ONLINE',amount:29.05,cat:'Food',type:"expense"},
  {id:"s036",date:"2026-01-06",desc:'AMAZON MKTPL*RY51K2FN3',amount:39.58,cat:'Entertainment',type:"expense"},
  {id:"s037",date:"2026-01-06",desc:'TARGET.COM',amount:7.12,cat:'Shopping & Subscription',type:"expense"},
  {id:"s038",date:"2026-01-06",desc:'TARGET.COM',amount:20.34,cat:'Shopping & Subscription',type:"expense"},
  {id:"s039",date:"2026-01-06",desc:'TARGET.COM',amount:101.31,cat:'Shopping & Subscription',type:"expense"},
  {id:"s040",date:"2026-01-06",desc:'TARGET.COM',amount:165.28,cat:'Shopping & Subscription',type:"expense"},
  {id:"s041",date:"2026-01-07",desc:'TARGET.COM  *',amount:8.56,cat:'Miscellaneous',type:"expense"},
  {id:"s042",date:"2026-01-07",desc:'DON PAN KENDALL',amount:19.85,cat:'Food',type:"expense"},
  {id:"s043",date:"2026-01-07",desc:'DON PAN KENDALL',amount:4.64,cat:'Food',type:"expense"},
  {id:"s044",date:"2026-01-07",desc:'WORLD VISION DONATION',amount:85.0,cat:'Tithe, Charity, & Gifts',type:"expense"},
  {id:"s045",date:"2026-01-07",desc:'AMAZON MKTPL*PS7FM5CH3',amount:57.59,cat:'Kid\'s',type:"expense"},
  {id:"s046",date:"2026-01-08",desc:'MONICA SCARDINA',amount:20.0,cat:'Miscellaneous',type:"expense"},
  {id:"s047",date:"2026-01-08",desc:'Sunpass',amount:10.0,cat:'Transportation',type:"expense"},
  {id:"s048",date:"2026-01-08",desc:'WALMART.COM',amount:31.0,cat:'Housewares and furnishings',type:"expense"},
  {id:"s049",date:"2026-01-08",desc:'PUBLIX #328',amount:37.01,cat:'Food',type:"expense"},
  {id:"s050",date:"2026-01-08",desc:'AMAZON MKTPL*7C3LQ8FP3',amount:54.83,cat:'Housing & Utilities',type:"expense"},
  {id:"s051",date:"2026-01-08",desc:'AMAZON MKTPL*QQ6L71BV3',amount:15.15,cat:'Shopping & Subscription',type:"expense"},
  {id:"s052",date:"2026-01-08",desc:'Walmart.com',amount:30.2,cat:'Shopping & Subscription',type:"expense"},
  {id:"s053",date:"2026-01-09",desc:'PUBLIX #084',amount:18.79,cat:'Food',type:"expense"},
  {id:"s054",date:"2026-01-09",desc:'Amazon.com*C68YA7K43',amount:27.58,cat:'Kid\'s',type:"expense"},
  {id:"s055",date:"2026-01-09",desc:'AMAZON MKTPL*YA3PD4GT3',amount:9.99,cat:'Kid\'s',type:"expense"},
  {id:"s056",date:"2026-01-09",desc:'7-ELEVEN 37548',amount:33.54,cat:'Transportation',type:"expense"},
  {id:"s057",date:"2026-01-09",desc:'WALMART.COM',amount:69.78,cat:'Shopping & Subscription',type:"expense"},
  {id:"s058",date:"2026-01-09",desc:'AMAZON MKTPL*B16MP4843',amount:37.86,cat:'Entertainment',type:"expense"},
  {id:"s059",date:"2026-01-09",desc:'AMAZON MKTPL*YH5KN3XR3',amount:9.62,cat:'Entertainment',type:"expense"},
  {id:"s060",date:"2026-01-10",desc:'CVS/PHARMACY #03764',amount:41.73,cat:'Personal Care',type:"expense"},
  {id:"s061",date:"2026-01-10",desc:'WALMART.COM',amount:19.25,cat:'Kid\'s',type:"expense"},
  {id:"s062",date:"2026-01-10",desc:'Target',amount:21.23,cat:'Tithe, Charity, & Gifts',type:"expense"},
  {id:"s063",date:"2026-01-11",desc:'RING BASIC PLAN',amount:49.99,cat:'Shopping & Subscription',type:"expense"},
  {id:"s064",date:"2026-01-11",desc:'CHIPOTLE MEX GR ONLINE',amount:22.9,cat:'Food',type:"expense"},
  {id:"s065",date:"2026-01-11",desc:'Netflix',amount:9.04,cat:'Shopping & Subscription',type:"expense"},
  {id:"s066",date:"2026-01-11",desc:'Amazon Marketplace',amount:36.19,cat:'Kid\'s',type:"expense"},
  {id:"s067",date:"2026-01-11",desc:'CK AT CUTLER RIDGE OLO',amount:14.11,cat:'Food',type:"expense"},
  {id:"s068",date:"2026-01-11",desc:'EL CAR WASH PALMETTO B',amount:37.45,cat:'Transportation',type:"expense"},
  {id:"s069",date:"2026-01-12",desc:'Venmo',amount:25.0,cat:'Education Expense',type:"expense"},
  {id:"s070",date:"2026-01-12",desc:'XFINITY MOBILE',amount:64.02,cat:'Housing & Utilities',type:"expense"},
  {id:"s071",date:"2026-01-12",desc:'Walmart.com',amount:93.76,cat:'Kid\'s',type:"expense"},
  {id:"s072",date:"2026-01-12",desc:'Adobe',amount:29.99,cat:'Shopping & Subscription',type:"expense"},
  {id:"s073",date:"2026-01-12",desc:'Amazon Marketplace',amount:38.93,cat:'Shopping & Subscription',type:"expense"},
  {id:"s074",date:"2026-01-12",desc:'Amazon Marketplace',amount:7.48,cat:'Shopping & Subscription',type:"expense"},
  {id:"s075",date:"2026-01-12",desc:'Amazon Marketplace',amount:18.18,cat:'Shopping & Subscription',type:"expense"},
  {id:"s076",date:"2026-01-12",desc:'Walmart.com',amount:55.66,cat:'Housewares and furnishings',type:"expense"},
  {id:"s077",date:"2026-01-12",desc:'Disney+',amount:14.69,cat:'Shopping & Subscription',type:"expense"},
  {id:"s078",date:"2026-01-12",desc:'Elis Cafe',amount:12.8,cat:'Food',type:"expense"},
  {id:"s079",date:"2026-01-13",desc:'TARGET.COM',amount:10.0,cat:'Shopping & Subscription',type:"expense"},
  {id:"s080",date:"2026-01-13",desc:'Walmart.com',amount:186.72,cat:'Food',type:"expense"},
  {id:"s081",date:"2026-01-13",desc:'PUBLIX #328',amount:11.68,cat:'Food',type:"expense"},
  {id:"s082",date:"2026-01-13",desc:'TARGET.COM',amount:175.56,cat:'Shopping & Subscription',type:"expense"},
  {id:"s083",date:"2026-01-14",desc:'Target',amount:14.12,cat:'Food',type:"expense"},
  {id:"s084",date:"2026-01-14",desc:'Target',amount:66.09,cat:'Kid\'s',type:"expense"},
  {id:"s085",date:"2026-01-14",desc:'SHELL OIL 57543872501',amount:52.58,cat:'Transportation',type:"expense"},
  {id:"s086",date:"2026-01-14",desc:'TST*CUBAN GUYS - PALMETT',amount:41.7,cat:'Food',type:"expense"},
  {id:"s087",date:"2026-01-14",desc:'VARSITY YEARBOOK',amount:48.99,cat:'Education Expense',type:"expense"},
  {id:"s088",date:"2026-01-14",desc:'Going Going Gone',amount:43.18,cat:'Shopping & Subscription',type:"expense"},
  {id:"s089",date:"2026-01-15",desc:'Adelina Hernandez',amount:205.0,cat:'Housing & Utilities',type:"expense"},
  {id:"s090",date:"2026-01-15",desc:'Spotify USA',amount:13.57,cat:'Shopping & Subscription',type:"expense"},
  {id:"s091",date:"2026-01-15",desc:'CVS/PHARMACY #03764',amount:77.08,cat:'Personal Care',type:"expense"},
  {id:"s092",date:"2026-01-15",desc:'CVS/PHARMACY #03764',amount:7.42,cat:'Personal Care',type:"expense"},
  {id:"s093",date:"2026-01-15",desc:'COMPASSION INTERNATION',amount:43.0,cat:'Tithe, Charity, & Gifts',type:"expense"},
  {id:"s094",date:"2026-01-16",desc:'ROSS STORES #2040',amount:16.04,cat:'Shopping & Subscription',type:"expense"},
  {id:"s095",date:"2026-01-16",desc:'DUNKIN #302052',amount:25.49,cat:'Food',type:"expense"},
  {id:"s096",date:"2026-01-16",desc:'TST* RICE MEDITERRANEAN K',amount:31.22,cat:'Food',type:"expense"},
  {id:"s097",date:"2026-01-16",desc:'AMAZON MKTPLACE PMTS',amount:-170.13,cat:'Shopping & Subscription',type:"expense"},
  {id:"s098",date:"2026-01-17",desc:'WALMART.COM',amount:97.46,cat:'Food',type:"expense"},
  {id:"s099",date:"2026-01-17",desc:'FISHEATING CREEK OUTPO',amount:13.89,cat:'Miscellaneous',type:"expense"},
  {id:"s100",date:"2026-01-18",desc:'FISHEATING CREEK OUTPO',amount:3.95,cat:'Miscellaneous',type:"expense"},
  {id:"s101",date:"2026-01-18",desc:'FISHEATING CREEK OUTPO',amount:37.45,cat:'Miscellaneous',type:"expense"},
  {id:"s102",date:"2026-01-18",desc:'FISHEATING CREEK OUTPO',amount:18.51,cat:'Miscellaneous',type:"expense"},
  {id:"s103",date:"2026-01-19",desc:'FISHEATING CREEK OUTPO',amount:4.28,cat:'Miscellaneous',type:"expense"},
  {id:"s104",date:"2026-01-19",desc:'FISHEATING CREEK OUTPO',amount:59.94,cat:'Miscellaneous',type:"expense"},
  {id:"s105",date:"2026-01-19",desc:'MCDONALD\'S F7661',amount:15.45,cat:'Food',type:"expense"},
  {id:"s106",date:"2026-01-19",desc:'EXXON CLEWISTON PETROL',amount:36.79,cat:'Transportation',type:"expense"},
  {id:"s107",date:"2026-01-19",desc:'FISHEATING CREEK OUTPO',amount:12.82,cat:'Miscellaneous',type:"expense"},
  {id:"s108",date:"2026-01-19",desc:'WENDY\'S 7661',amount:14.05,cat:'Food',type:"expense"},
  {id:"s109",date:"2026-01-20",desc:'Venmo - Hardrock Bet',amount:100.0,cat:'Entertainment',type:"expense"},
  {id:"s110",date:"2026-01-20",desc:'Sunpass',amount:10.0,cat:'Transportation',type:"expense"},
  {id:"s111",date:"2026-01-20",desc:'VLG OF PALMETTO BAY',amount:66.0,cat:'Entertainment',type:"expense"},
  {id:"s112",date:"2026-01-20",desc:'CHIPOTLE MEX GR ONLINE',amount:21.17,cat:'Food',type:"expense"},
  {id:"s113",date:"2026-01-20",desc:'7-ELEVEN 37548',amount:37.14,cat:'Transportation',type:"expense"},
  {id:"s114",date:"2026-01-21",desc:'WEBPAY-COURTORTICKET',amount:256.5,cat:'Transportation',type:"expense"},
  {id:"s115",date:"2026-01-21",desc:'AMAZON MKTPLACE PMTS',amount:-9.62,cat:'Shopping & Subscription',type:"expense"},
  {id:"s116",date:"2026-01-21",desc:'AMAZON MKTPLACE PMTS',amount:-10.59,cat:'Shopping & Subscription',type:"expense"},
  {id:"s117",date:"2026-01-21",desc:'DOLLARTREE',amount:78.91,cat:'Shopping & Subscription',type:"expense"},
  {id:"s118",date:"2026-01-22",desc:'ROADSIDE ASSISTANCE',amount:6.08,cat:'Transportation',type:"expense"},
  {id:"s119",date:"2026-01-23",desc:'MONICA SCARDINA',amount:26.0,cat:'Education Expense',type:"expense"},
  {id:"s120",date:"2026-01-23",desc:'WALMART.COM',amount:231.95,cat:'Food',type:"expense"},
  {id:"s121",date:"2026-01-23",desc:'CHIPOTLE 4699',amount:32.94,cat:'Food',type:"expense"},
  {id:"s122",date:"2026-01-24",desc:'AMAZON MKTPL*0I6D83OM3',amount:35.13,cat:'Shopping & Subscription',type:"expense"},
  {id:"s123",date:"2026-01-25",desc:'Target',amount:38.26,cat:'Kid\'s',type:"expense"},
  {id:"s124",date:"2026-01-25",desc:'COMPASSION INTERNATION',amount:25.0,cat:'Tithe, Charity, & Gifts',type:"expense"},
  {id:"s125",date:"2026-01-25",desc:'MCDONALD\'S F2287',amount:10.48,cat:'Food',type:"expense"},
  {id:"s126",date:"2026-01-25",desc:'WALMART.COM',amount:41.37,cat:'Shopping & Subscription',type:"expense"},
  {id:"s127",date:"2026-01-25",desc:'Shell',amount:53.91,cat:'Transportation',type:"expense"},
  {id:"s128",date:"2026-01-26",desc:'MONICA SCARDINA',amount:15.0,cat:'Education Expense',type:"expense"},
  {id:"s129",date:"2026-01-26",desc:'Publix',amount:75.01,cat:'Food',type:"expense"},
  {id:"s130",date:"2026-01-26",desc:'Chipotle',amount:9.47,cat:'Food',type:"expense"},
  {id:"s131",date:"2026-01-27",desc:'Sunpass',amount:10.0,cat:'Transportation',type:"expense"},
  {id:"s132",date:"2026-01-27",desc:'ALLSTATE *PAYMENT',amount:213.64,cat:'Transportation',type:"expense"},
  {id:"s133",date:"2026-01-27",desc:'Publix',amount:22.86,cat:'Food',type:"expense"},
  {id:"s134",date:"2026-01-28",desc:'Starbucks',amount:12.73,cat:'Food',type:"expense"},
  {id:"s135",date:"2026-01-28",desc:'ULTA Online',amount:144.43,cat:'Personal Care',type:"expense"},
  {id:"s136",date:"2026-01-28",desc:'Trader Joe\'s',amount:268.37,cat:'Food',type:"expense"},
  {id:"s137",date:"2026-01-28",desc:'IKEA',amount:89.53,cat:'Housewares and furnishings',type:"expense"},
  {id:"s138",date:"2026-01-29",desc:'Honda',amount:92.5,cat:'Transportation',type:"expense"},
  {id:"s139",date:"2026-01-29",desc:'Charlene Ramirez',amount:180.0,cat:'Housing & Utilities',type:"expense"},
  {id:"s140",date:"2026-01-29",desc:'PAC-LIFE-LYN-INF',amount:41.38,cat:'Miscellaneous',type:"expense"},
  {id:"s141",date:"2026-01-30",desc:'CVS',amount:7.8,cat:'Personal Care',type:"expense"},
  {id:"s142",date:"2026-01-30",desc:'Panera Bread',amount:11.95,cat:'Food',type:"expense"},
  {id:"s143",date:"2026-01-30",desc:'Haagen-Dazs',amount:14.02,cat:'Food',type:"expense"},
  {id:"s144",date:"2026-01-30",desc:'ARCADE TIME ENTERTAIN',amount:40.13,cat:'Entertainment',type:"expense"},
  {id:"s145",date:"2026-01-31",desc:'Publix',amount:17.78,cat:'Food',type:"expense"},
  {id:"s146",date:"2026-01-31",desc:'ST ANDREW GREEK ORTH',amount:18.0,cat:'Entertainment',type:"expense"},
  {id:"s147",date:"2026-01-31",desc:'BAKERY',amount:12.0,cat:'Food',type:"expense"},
  {id:"s148",date:"2026-01-31",desc:'ST ANDREW GREEK ORTH',amount:14.0,cat:'Entertainment',type:"expense"},
  {id:"s149",date:"2026-01-31",desc:'ST ANDREW GREEK ORTH',amount:10.0,cat:'Entertainment',type:"expense"},
  {id:"s150",date:"2026-01-31",desc:'ST ANDREW GREEK ORTH',amount:21.0,cat:'Entertainment',type:"expense"},
  {id:"s151",date:"2026-02-01",desc:'KAREN KENNEDY',amount:95.0,cat:'Kid\'s',type:"expense"},
  {id:"s152",date:"2026-02-01",desc:'Luis Guzman - Sofa table',amount:30.0,cat:'Housewares and furnishings',type:"expense"},
  {id:"s153",date:"2026-02-01",desc:'CHEVRON',amount:49.57,cat:'Transportation',type:"expense"},
  {id:"s154",date:"2026-02-01",desc:'St Andrews Episcopal Church',amount:410.0,cat:'Education Expense',type:"expense"},
  {id:"s155",date:"2026-02-02",desc:'KAREN KENNEDY',amount:55.0,cat:'Kid\'s',type:"expense"},
  {id:"s156",date:"2026-02-02",desc:'NFCU ACH',amount:300.84,cat:'Transportation',type:"expense"},
  {id:"s157",date:"2026-02-02",desc:'CHRIST FELLOWSHI',amount:100.0,cat:'Tithe, Charity, & Gifts',type:"expense"},
  {id:"s158",date:"2026-02-02",desc:'Amazon',amount:67.37,cat:'Shopping & Subscription',type:"expense"},
  {id:"s159",date:"2026-02-02",desc:'FRANJO AMOC',amount:37.48,cat:'Transportation',type:"expense"},
  {id:"s160",date:"2026-02-02",desc:'www.bubbi.app',amount:35.0,cat:'Shopping & Subscription',type:"expense"},
  {id:"s161",date:"2026-02-02",desc:'Microsoft*Microsoft 365 F',amount:12.99,cat:'Shopping & Subscription',type:"expense"},
  {id:"s162",date:"2026-02-02",desc:'CENTRAL MISSIONARY CLEARI',amount:205.75,cat:'Tithe, Charity, & Gifts',type:"expense"},
  {id:"s163",date:"2026-02-03",desc:'Club La Costa Ho',amount:70.5,cat:'Housing & Utilities',type:"expense"},
  {id:"s164",date:"2026-02-03",desc:'BANNER LIFE',amount:16.79,cat:'Miscellaneous',type:"expense"},
  {id:"s165",date:"2026-02-03",desc:'PENNYMAC',amount:1538.31,cat:'Housing & Utilities',type:"expense"},
  {id:"s166",date:"2026-02-03",desc:'IKEA',amount:44.91,cat:'Housewares and furnishings',type:"expense"},
  {id:"s167",date:"2026-02-03",desc:'IKEA',amount:89.53,cat:'Housewares and furnishings',type:"expense"},
  {id:"s168",date:"2026-02-03",desc:'IKEA',amount:-84.53,cat:'Housewares and furnishings',type:"expense"},
  {id:"s169",date:"2026-02-03",desc:'IKEA',amount:-85.59,cat:'Housewares and furnishings',type:"expense"},
  {id:"s170",date:"2026-02-03",desc:'Starbucks',amount:11.45,cat:'Food',type:"expense"},
  {id:"s171",date:"2026-02-03",desc:'Walmart.com',amount:162.29,cat:'Food',type:"expense"},
  {id:"s172",date:"2026-02-03",desc:'FPL DIRECT DEBIT',amount:185.26,cat:'Housing & Utilities',type:"expense"},
  {id:"s173",date:"2026-02-04",desc:'DON PAN KENDALL',amount:11.28,cat:'Food',type:"expense"},
  {id:"s174",date:"2026-02-04",desc:'DNA FITNESS',amount:159.0,cat:'Personal Care',type:"expense"},
  {id:"s175",date:"2026-02-04",desc:'PANERA BREAD #600983 P',amount:7.27,cat:'Food',type:"expense"},
  {id:"s176",date:"2026-02-05",desc:'Honda',amount:604.98,cat:'Transportation',type:"expense"},
  {id:"s177",date:"2026-02-05",desc:'Airbnb',amount:555.0,cat:'Entertainment',type:"expense"},
  {id:"s178",date:"2026-02-05",desc:'DOLLARTREE',amount:14.96,cat:'Shopping & Subscription',type:"expense"},
  {id:"s179",date:"2026-02-05",desc:'CANVA* I04783-12683563',amount:14.99,cat:'Shopping & Subscription',type:"expense"},
  {id:"s180",date:"2026-02-06",desc:'CRICUT',amount:9.99,cat:'Shopping & Subscription',type:"expense"},
  {id:"s181",date:"2026-02-06",desc:'GOODWILL - PALMETTO BAY',amount:58.73,cat:'Shopping & Subscription',type:"expense"},
  {id:"s182",date:"2026-02-06",desc:'TST*SANGUICH DE MIAMI -',amount:3.85,cat:'Food',type:"expense"},
  {id:"s183",date:"2026-02-06",desc:'AMERICAN THRIFT STORE',amount:17.3,cat:'Shopping & Subscription',type:"expense"},
  {id:"s184",date:"2026-02-07",desc:'TACO BELL 042907',amount:28.61,cat:'Food',type:"expense"},
  {id:"s185",date:"2026-02-07",desc:'TACO BELL 042907',amount:6.3,cat:'Food',type:"expense"},
  {id:"s186",date:"2026-02-07",desc:'PAPA JOHN\'S #0513',amount:39.01,cat:'Food',type:"expense"},
  {id:"s187",date:"2026-02-07",desc:'AMAZON MKTPL*7B02A6OR3',amount:47.05,cat:'Shopping & Subscription',type:"expense"},
  {id:"s188",date:"2026-02-07",desc:'WORLD VISION DONATION',amount:85.0,cat:'Tithe, Charity, & Gifts',type:"expense"},
  {id:"s189",date:"2026-02-07",desc:'CHEVRON 0384107',amount:55.99,cat:'Transportation',type:"expense"},
  {id:"s190",date:"2026-02-08",desc:'POLLOTROPICAL',amount:28.8,cat:'Housing & Utilities',type:"expense"},
  {id:"s191",date:"2026-02-08",desc:'WALMART.COM',amount:178.83,cat:'Food',type:"expense"},
  {id:"s192",date:"2026-02-08",desc:'PUBLIX #328',amount:8.55,cat:'Food',type:"expense"},
  {id:"s193",date:"2026-02-08",desc:'GIRL SCOUTS OF THE UNITED',amount:47.99,cat:'Food',type:"expense"},
  {id:"s194",date:"2026-02-09",desc:'YESENIA ILLA',amount:30.0,cat:'Housewares and furnishings',type:"expense"},
  {id:"s195",date:"2026-02-09",desc:'COMCAST-XFINITY',amount:50.23,cat:'Housing & Utilities',type:"expense"},
  {id:"s196",date:"2026-02-09",desc:'Sunpass',amount:10.0,cat:'Transportation',type:"expense"},
  {id:"s197",date:"2026-02-09",desc:'SHELL OIL 57543955405',amount:19.04,cat:'Transportation',type:"expense"},
  {id:"s198",date:"2026-02-09",desc:'CONTAINERSTOREMIAMIFL',amount:48.13,cat:'Housewares and furnishings',type:"expense"},
  {id:"s199",date:"2026-02-09",desc:'VCO*St Andrew\'s Episco',amount:30.0,cat:'Tithe, Charity, & Gifts',type:"expense"},
  {id:"s200",date:"2026-02-09",desc:'PAYPAL *SHOP LEGO',amount:53.48,cat:'Tithe, Charity, & Gifts',type:"expense"},
  {id:"s201",date:"2026-02-10",desc:'Nathan Ward',amount:40.0,cat:'Housewares and furnishings',type:"expense"},
  {id:"s202",date:"2026-02-10",desc:'Eduardo Rodriguez',amount:30.0,cat:'Education Expense',type:"expense"},
  {id:"s203",date:"2026-02-10",desc:'Haircuts',amount:40.0,cat:'Personal Care',type:"expense"},
  {id:"s204",date:"2026-02-10",desc:'AMAZON MKTPL*YR16L5SO3',amount:20.92,cat:'Shopping & Subscription',type:"expense"},
  {id:"s205",date:"2026-02-10",desc:'PARTY CAKE BAKERY X',amount:2.51,cat:'Food',type:"expense"},
  {id:"s206",date:"2026-02-10",desc:'AMAZON MKTPL*RZ7UB9673',amount:94.64,cat:'Tithe, Charity, & Gifts',type:"expense"},
  {id:"s207",date:"2026-02-11",desc:'ALDI 77018 PALMETTO BA',amount:51.65,cat:'Food',type:"expense"},
  {id:"s208",date:"2026-02-11",desc:'AMAZON MKTPL*0S3J46S13',amount:30.99,cat:'Tithe, Charity, & Gifts',type:"expense"},
  {id:"s209",date:"2026-02-11",desc:'Netflix.com',amount:9.04,cat:'Shopping & Subscription',type:"expense"},
  {id:"s210",date:"2026-02-11",desc:'WALMART.COM',amount:169.33,cat:'Food',type:"expense"},
  {id:"s211",date:"2026-02-11",desc:'DOLLARTREE',amount:20.55,cat:'Education Expense',type:"expense"},
  {id:"s212",date:"2026-02-11",desc:'7-ELEVEN 37548',amount:25.48,cat:'Transportation',type:"expense"},
  {id:"s213",date:"2026-02-12",desc:'T J MAXX #1203',amount:46.49,cat:'Shopping & Subscription',type:"expense"},
  {id:"s214",date:"2026-02-12",desc:'XFINITY MOBILE',amount:64.0,cat:'Housing & Utilities',type:"expense"},
  {id:"s215",date:"2026-02-13",desc:'ADOBE  *800-833-6687',amount:29.99,cat:'Shopping & Subscription',type:"expense"},
  {id:"s216",date:"2026-02-13",desc:'SP TOMSUS',amount:79.45,cat:'Personal Care',type:"expense"},
  {id:"s217",date:"2026-02-13",desc:'SQ *DELEITES EVENTS & CAT',amount:13.15,cat:'Food',type:"expense"},
  {id:"s218",date:"2026-02-13",desc:'MARSHALLS #0404',amount:57.91,cat:'Tithe, Charity, & Gifts',type:"expense"},
  {id:"s219",date:"2026-02-13",desc:'CHIPOTLE MEX GR ONLINE',amount:9.79,cat:'Food',type:"expense"},
  {id:"s220",date:"2026-02-13",desc:'TOBACCO PLUS',amount:32.09,cat:'Personal Care',type:"expense"},
  {id:"s221",date:"2026-02-13",desc:'TST*VOLCANIC SUSHI & SAK',amount:36.48,cat:'Food',type:"expense"},
  {id:"s222",date:"2026-02-13",desc:'WALMART.COM',amount:42.81,cat:'Food',type:"expense"},
  {id:"s223",date:"2026-02-13",desc:'Disney Plus',amount:14.69,cat:'Shopping & Subscription',type:"expense"},
  {id:"s224",date:"2026-02-13",desc:'SMDCAC CONC',amount:11.0,cat:'Food',type:"expense"},
  {id:"s225",date:"2026-02-13",desc:'DON PAN KENDALL',amount:18.84,cat:'Food',type:"expense"},
  {id:"s226",date:"2026-02-14",desc:'COLDSTONE #1167',amount:9.41,cat:'Housing & Utilities',type:"expense"},
  {id:"s227",date:"2026-02-14",desc:'PUBLIX #328',amount:74.54,cat:'Food',type:"expense"},
  {id:"s228",date:"2026-02-14",desc:'7-ELEVEN 37548',amount:46.12,cat:'Transportation',type:"expense"},
  {id:"s229",date:"2026-02-14",desc:'PARKING PAY PHONE',amount:11.2,cat:'Transportation',type:"expense"},
  {id:"s230",date:"2026-02-14",desc:'MICHAEL GAMACHE',amount:100.0,cat:'Shopping & Subscription',type:"expense"},
  {id:"s231",date:"2026-02-15",desc:'Chic Nails',amount:135.0,cat:'Personal Care',type:"expense"},
  {id:"s232",date:"2026-02-15",desc:'Charlene Ramirez',amount:150.0,cat:'Housing & Utilities',type:"expense"},
  {id:"s233",date:"2026-02-15",desc:'JOAQUIN RODRIGUEZ',amount:20.0,cat:'Shopping & Subscription',type:"expense"},
  {id:"s234",date:"2026-02-15",desc:'LITTLE CAESARS #2304',amount:10.15,cat:'Food',type:"expense"},
  {id:"s235",date:"2026-02-15",desc:'COMPASSION INTERNATION',amount:43.0,cat:'Tithe, Charity, & Gifts',type:"expense"},
  {id:"s236",date:"2026-02-15",desc:'AMAZON MKTPL*GO0AN2XH3',amount:73.49,cat:'Shopping & Subscription',type:"expense"},
  {id:"s237",date:"2026-02-15",desc:'Spotify USA',amount:14.7,cat:'Shopping & Subscription',type:"expense"},
  {id:"s238",date:"2026-02-15",desc:'Amazon.com*JI5A16TV3',amount:7.8,cat:'Shopping & Subscription',type:"expense"},
  {id:"s239",date:"2026-02-16",desc:'TST* 3 CHEFS AND A CHICKE',amount:44.2,cat:'Food',type:"expense"},
  {id:"s240",date:"2026-02-16",desc:'CHIPOTLE MEX GR ONLINE',amount:22.19,cat:'Food',type:"expense"},
  {id:"s241",date:"2026-02-16",desc:'HM.COM',amount:124.76,cat:'Shopping & Subscription',type:"expense"},
  {id:"s242",date:"2026-02-17",desc:'ALEXANDRA WOOD',amount:40.0,cat:'Shopping & Subscription',type:"expense"},
  {id:"s243",date:"2026-02-17",desc:'Sunpass',amount:10.0,cat:'Transportation',type:"expense"},
  {id:"s244",date:"2026-02-17",desc:'STAPLES       00117788',amount:0.31,cat:'Miscellaneous',type:"expense"},
  {id:"s245",date:"2026-02-17",desc:'AMAZON MKTPL*3L6NB3C83',amount:26.11,cat:'Shopping & Subscription',type:"expense"},
  {id:"s246",date:"2026-02-18",desc:'THOMAS OCONNELL',amount:50.0,cat:'Shopping & Subscription',type:"expense"},
  {id:"s247",date:"2026-02-18",desc:'KIM HILL',amount:55.0,cat:'Shopping & Subscription',type:"expense"},
  {id:"s248",date:"2026-02-18",desc:'target',amount:30.3,cat:'Shopping & Subscription',type:"expense"},
  {id:"s249",date:"2026-02-18",desc:'EL CAR WASH - LE JEUNE',amount:10.0,cat:'Transportation',type:"expense"},
  {id:"s250",date:"2026-02-18",desc:'THE HOME DEPOT 207',amount:17.63,cat:'Housewares and furnishings',type:"expense"},
  {id:"s251",date:"2026-02-18",desc:'CHIPOTLE MEX GR ONLINE',amount:10.17,cat:'Food',type:"expense"},
  {id:"s252",date:"2026-02-18",desc:'TARGET        00011635',amount:11.02,cat:'Shopping & Subscription',type:"expense"},
  {id:"s253",date:"2026-02-18",desc:'WALMART.COM',amount:32.09,cat:'Shopping & Subscription',type:"expense"},
  {id:"s254",date:"2026-02-18",desc:'EXXON 17TH & DIXIE',amount:50.33,cat:'Transportation',type:"expense"},
  {id:"s255",date:"2026-02-18",desc:'AMAZON MKTPLACE PMTS',amount:-21.38,cat:'Shopping & Subscription',type:"expense"},
  {id:"s256",date:"2026-02-19",desc:'ILIANA ARTIME',amount:87.0,cat:'Shopping & Subscription',type:"expense"},
  {id:"s257",date:"2026-02-19",desc:'WALMART.COM',amount:42.39,cat:'Shopping & Subscription',type:"expense"},
  {id:"s258",date:"2026-02-19",desc:'WALMART.COM',amount:53.44,cat:'Shopping & Subscription',type:"expense"},
  {id:"s259",date:"2026-02-19",desc:'WALMART.COM',amount:213.93,cat:'Food',type:"expense"},
  {id:"s260",date:"2026-02-19",desc:'CHIPOTLE MEX GR ONLINE',amount:9.79,cat:'Food',type:"expense"},
  {id:"s261",date:"2026-02-20",desc:'Sunpass',amount:10.0,cat:'Transportation',type:"expense"},
  {id:"s262",date:"2026-02-20",desc:'ROADSIDE ASSISTANCE',amount:6.5,cat:'Transportation',type:"expense"},
  {id:"s263",date:"2026-02-20",desc:'SHELL OIL 57543872501',amount:40.36,cat:'Transportation',type:"expense"},
  {id:"s264",date:"2026-02-20",desc:'WALMART.COM',amount:38.85,cat:'Shopping & Subscription',type:"expense"},
  {id:"s265",date:"2026-02-20",desc:'T J MAXX #1203',amount:100.37,cat:'Shopping & Subscription',type:"expense"},
  {id:"s266",date:"2026-02-21",desc:'JCPENNEY 2660',amount:21.39,cat:'Shopping & Subscription',type:"expense"},
  {id:"s267",date:"2026-02-21",desc:'AMAZON MKTPL*B90P63HW2',amount:265.03,cat:'Shopping & Subscription',type:"expense"},
  {id:"s268",date:"2026-02-21",desc:'SQ *CONCESSIONS STAND',amount:6.35,cat:'Food',type:"expense"},
  {id:"s269",date:"2026-02-21",desc:'SQ *CONCESSIONS STAND',amount:-1.0,cat:'Food',type:"expense"},
  {id:"s270",date:"2026-02-21",desc:'DQ TRT CTR #14111',amount:9.31,cat:'Food',type:"expense"},
  {id:"s271",date:"2026-02-21",desc:'WALMART.COM',amount:71.95,cat:'Food',type:"expense"},
  {id:"s272",date:"2026-02-22",desc:'LITTLE CAESARS #2223',amount:12.15,cat:'Food',type:"expense"},
  {id:"s273",date:"2026-02-22",desc:'MCDONALD\'S F1856',amount:20.31,cat:'Food',type:"expense"},
  {id:"s274",date:"2026-02-22",desc:'Build-A-Bear 1238',amount:47.62,cat:'Tithe, Charity, & Gifts',type:"expense"},
  {id:"s275",date:"2026-02-22",desc:'SQ *ARCADE TIME ENTERTAIN',amount:53.5,cat:'Tithe, Charity, & Gifts',type:"expense"},
  {id:"s276",date:"2026-02-23",desc:'OLIVE GARDEN ZK 0024429',amount:82.05,cat:'Food',type:"expense"},
  {id:"s277",date:"2026-02-23",desc:'EL CAR WASH - PALMETTO BA',amount:10.0,cat:'Transportation',type:"expense"},
  {id:"s278",date:"2026-02-23",desc:'PAR*PINECREST BAKERY - P8',amount:5.55,cat:'Food',type:"expense"},
  {id:"s279",date:"2026-02-23",desc:'AMOCO#1018400FRANJO AMOC',amount:47.32,cat:'Transportation',type:"expense"},
  {id:"s280",date:"2026-02-23",desc:'AMAZON MKTPL*QJ3ZZ7HN3',amount:51.36,cat:'Shopping & Subscription',type:"expense"},
  {id:"s281",date:"2026-02-23",desc:'AMAZON MKTPLACE PMTS',amount:-44.63,cat:'Shopping & Subscription',type:"expense"},
  {id:"s282",date:"2026-02-24",desc:'DEBORA ROSSATO',amount:30.0,cat:'Shopping & Subscription',type:"expense"},
  {id:"s283",date:"2026-02-24",desc:'Paypal to Andy',amount:14.87,cat:'Shopping & Subscription',type:"expense"},
  {id:"s284",date:"2026-02-24",desc:'Amazon.com*386SL7Q33',amount:16.69,cat:'Shopping & Subscription',type:"expense"},
  {id:"s285",date:"2026-02-25",desc:'MONICA DIAZ',amount:30.0,cat:'Shopping & Subscription',type:"expense"},
  {id:"s286",date:"2026-02-25",desc:'IC* INSTACART*159',amount:75.37,cat:'Food',type:"expense"},
  {id:"s287",date:"2026-02-25",desc:'COMPASSION INTERNATION',amount:25.0,cat:'Tithe, Charity, & Gifts',type:"expense"},
  {id:"s288",date:"2026-02-26",desc:'TRADER JOE S #770',amount:175.29,cat:'Food',type:"expense"},
  {id:"s289",date:"2026-02-26",desc:'SP KITSCH',amount:23.35,cat:'Miscellaneous',type:"expense"},
  {id:"s290",date:"2026-02-26",desc:'CHIPOTLE MEX GR ONLINE',amount:9.79,cat:'Food',type:"expense"},
  {id:"s291",date:"2026-02-26",desc:'PAYPAL *SHOP LEGO',amount:-53.48,cat:'Shopping & Subscription',type:"expense"},
  {id:"s292",date:"2026-02-27",desc:'Charlene Ramirez',amount:150.0,cat:'Housing & Utilities',type:"expense"},
  {id:"s293",date:"2026-02-27",desc:'STARBUCKS STORE 08446',amount:6.69,cat:'Food',type:"expense"},
  {id:"s294",date:"2026-02-27",desc:'WALMART.COM',amount:265.59,cat:'Food',type:"expense"},
  {id:"s295",date:"2026-02-27",desc:'ALLSTATE    *PAYMENT',amount:205.31,cat:'Transportation',type:"expense"},
  {id:"s296",date:"2026-02-28",desc:'WF *WAYFAIR4604630831',amount:47.07,cat:'Housewares and furnishings',type:"expense"},
  {id:"s297",date:"2026-02-28",desc:'AMAZON MKTPL*B931T4150',amount:38.64,cat:'Shopping & Subscription',type:"expense"},
  {id:"s298",date:"2026-02-28",desc:'AMAZON MKTPL*BE6MA8DP2',amount:7.47,cat:'Shopping & Subscription',type:"expense"},
  {id:"s299",date:"2026-02-28",desc:'CHIPOTLE MEX GR ONLINE',amount:11.77,cat:'Food',type:"expense"},
  {id:"s300",date:"2026-02-28",desc:'AMAZON MKTPL*B921T3UR1',amount:19.68,cat:'Shopping & Subscription',type:"expense"},
  {id:"s301",date:"2026-02-28",desc:'AMAZON MKTPL*B90VH81B0',amount:6.05,cat:'Shopping & Subscription',type:"expense"},
  {id:"s302",date:"2026-03-01",desc:'PAULA ZULUAGA',amount:13.0,cat:'Shopping & Subscription',type:"expense"},
  {id:"s303",date:"2026-03-01",desc:'RACETRAC 2453',amount:34.89,cat:'Transportation',type:"expense"},
  {id:"s304",date:"2026-03-02",desc:'PENNYMAC',amount:1538.31,cat:'Housing & Utilities',type:"expense"},
  {id:"s305",date:"2026-03-02",desc:'NFCU ACH',amount:300.84,cat:'Transportation',type:"expense"},
  {id:"s306",date:"2026-03-02",desc:'CHRIST FELLOWSHI',amount:100.0,cat:'Tithe, Charity, & Gifts',type:"expense"},
  {id:"s307",date:"2026-03-02",desc:'Target',amount:71.0,cat:'Shopping & Subscription',type:"expense"},
  {id:"s308",date:"2026-03-02",desc:'PAC-LIFE-LYN-INF',amount:41.38,cat:'Shopping & Subscription',type:"expense"},
  {id:"s309",date:"2026-03-02",desc:'CENTRAL MISSIONARY CLEARI',amount:205.75,cat:'Tithe, Charity, & Gifts',type:"expense"},
  {id:"s310",date:"2026-03-02",desc:'CHEVRON 0356335',amount:49.74,cat:'Transportation',type:"expense"},
  {id:"s311",date:"2026-03-02",desc:'MICROSOFT*MICROSOFT 36',amount:12.99,cat:'Shopping & Subscription',type:"expense"},
  {id:"s312",date:"2026-03-03",desc:'Sunpass',amount:10.0,cat:'Transportation',type:"expense"},
  {id:"s313",date:"2026-03-03",desc:'Club La Costa Ho',amount:70.5,cat:'Housing & Utilities',type:"expense"},
  {id:"s314",date:"2026-03-03",desc:'BANNER LIFE',amount:16.79,cat:'Shopping & Subscription',type:"expense"},
  {id:"s315",date:"2026-03-03",desc:'KAREN KENNEDY',amount:150.0,cat:'Kid\'s',type:"expense"},
  {id:"s316",date:"2026-03-03",desc:'LITTLE CAESARS #2223',amount:16.67,cat:'Food',type:"expense"},
  {id:"s317",date:"2026-03-03",desc:'ST ANDREWS EPISCOPAL CHUR',amount:410.0,cat:'Education Expense',type:"expense"},
  {id:"s318",date:"2026-03-03",desc:'www.bubbi.app',amount:35.0,cat:'Miscellaneous',type:"expense"},
  {id:"s319",date:"2026-03-03",desc:'EBAY O*01-14329-78705',amount:31.02,cat:'Shopping & Subscription',type:"expense"},
  {id:"s320",date:"2026-03-04",desc:'Paypal - MTG',amount:20.0,cat:'Entertainment',type:"expense"},
  {id:"s321",date:"2026-03-04",desc:'Car stuff',amount:26.22,cat:'Transportation',type:"expense"},
  {id:"s322",date:"2026-03-04",desc:'Car stuff',amount:23.82,cat:'Transportation',type:"expense"},
  {id:"s323",date:"2026-03-04",desc:'CHIPOTLE MEX GR ONLINE',amount:9.79,cat:'Food',type:"expense"},
  {id:"s324",date:"2026-03-04",desc:'ALDI 77018 PALMETTO BA',amount:134.34,cat:'Food',type:"expense"},
  {id:"s325",date:"2026-03-04",desc:'IKEA 490118968',amount:147.66,cat:'Housewares and furnishings',type:"expense"},
  {id:"s326",date:"2026-03-05",desc:'MONICA SCARDINA',amount:18.0,cat:'Shopping & Subscription',type:"expense"},
  {id:"s327",date:"2026-03-05",desc:'SEPHORA THE FALLS',amount:261.08,cat:'Personal Care',type:"expense"},
  {id:"s328",date:"2026-03-05",desc:'PUBLIX #1465',amount:205.43,cat:'Food',type:"expense"},
  {id:"s329",date:"2026-03-05",desc:'VETERAN TICKETS FOUNDATIO',amount:13.58,cat:'Entertainment',type:"expense"},
  {id:"s330",date:"2026-03-05",desc:'TRUE NORTH CLASSICAL',amount:7.52,cat:'Kid\'s',type:"expense"},
  {id:"s331",date:"2026-03-05",desc:'HAAGEN-DAZS 612',amount:20.0,cat:'Food',type:"expense"},
  {id:"s332",date:"2026-03-05",desc:'PARTY CAKE BAKERY X',amount:6.7,cat:'Food',type:"expense"},
  {id:"s333",date:"2026-03-05",desc:'SP 10FLEXWRAPCO',amount:29.99,cat:'Miscellaneous',type:"expense"},
  {id:"s334",date:"2026-03-05",desc:'CANVA* I04811-13234054',amount:14.99,cat:'Shopping & Subscription',type:"expense"},
  {id:"s335",date:"2026-03-06",desc:'John Raine',amount:10.0,cat:'Food',type:"expense"},
  {id:"s336",date:"2026-03-06",desc:'Sunpass',amount:10.0,cat:'Transportation',type:"expense"},
  {id:"s337",date:"2026-03-06",desc:'SQ *FARMLIFE KETTLE',amount:4.28,cat:'Food',type:"expense"},
  {id:"s338",date:"2026-03-06",desc:'CRICUT',amount:9.99,cat:'Shopping & Subscription',type:"expense"},
  {id:"s339",date:"2026-03-06",desc:'PUMMAROLA PIZZA THE FALL',amount:50.0,cat:'Food',type:"expense"},
  {id:"s340",date:"2026-03-07",desc:'Charlene Ramirez',amount:150.0,cat:'Housing & Utilities',type:"expense"},
  {id:"s341",date:"2026-03-07",desc:'7-ELEVEN 37548',amount:61.37,cat:'Transportation',type:"expense"},
  {id:"s342",date:"2026-03-07",desc:'SP BOUNCE CURL',amount:90.34,cat:'Personal Care',type:"expense"},
  {id:"s343",date:"2026-03-07",desc:'WORLD VISION DONATION',amount:85.0,cat:'Tithe, Charity, & Gifts',type:"expense"},
  {id:"s344",date:"2026-03-07",desc:'WALGREENS #4808',amount:38.12,cat:'Shopping & Subscription',type:"expense"},
  {id:"s345",date:"2026-03-08",desc:'Chic Nails III LLC',amount:55.0,cat:'Personal Care',type:"expense"},
  {id:"s346",date:"2026-03-08",desc:'AirBNB',amount:632.7,cat:'Entertainment',type:"expense"},
  {id:"s347",date:"2026-03-09",desc:'FPL DIRECT DEBIT',amount:162.23,cat:'Housing & Utilities',type:"expense"},
  {id:"s348",date:"2026-03-09",desc:'COMCAST-XFINITY',amount:50.23,cat:'Housing & Utilities',type:"expense"},
  {id:"s349",date:"2026-03-09",desc:'STAPLES       00117788',amount:9.99,cat:'Miscellaneous',type:"expense"},
  {id:"s350",date:"2026-03-09",desc:'WALMART.COM',amount:216.24,cat:'Food',type:"expense"},
  {id:"s351",date:"2026-03-10",desc:'PUBLIX #1465',amount:116.04,cat:'Food',type:"expense"},
  {id:"s352",date:"2026-03-10",desc:'AMAZON MKTPL*BE4Y41YL0',amount:51.34,cat:'Shopping & Subscription',type:"expense"},
  {id:"s353",date:"2026-03-11",desc:'Paypal - MTG',amount:20.0,cat:'Entertainment',type:"expense"},
  {id:"s354",date:"2026-03-11",desc:'HOME FREE',amount:70.0,cat:'Entertainment',type:"expense"},
  {id:"s355",date:"2026-03-12",desc:'Allegiant',amount:785.12,cat:'Entertainment',type:"expense"},
  {id:"s356",date:"2026-01-01",desc:'VA',amount:1033.84,cat:'Income',type:"income"},
  {id:"s357",date:"2026-01-06",desc:'CITY NATIONAL BA',amount:12.5,cat:'Income',type:"income"},
  {id:"s358",date:"2026-01-09",desc:'ZOETIC STAGE, IN',amount:1150.0,cat:'Income',type:"income"},
  {id:"s359",date:"2026-01-14",desc:'CNB',amount:5227.82,cat:'Income',type:"income"},
  {id:"s360",date:"2026-01-29",desc:'CNB',amount:5227.82,cat:'Income',type:"income"},
  {id:"s361",date:"2026-02-01",desc:'VA',amount:1033.84,cat:'Income',type:"income"},
  {id:"s362",date:"2026-02-06",desc:'ZOETIC STAGE, IN',amount:617.85,cat:'Income',type:"income"},
  {id:"s363",date:"2026-02-06",desc:'ZOETIC STAGE, IN',amount:702.32,cat:'Income',type:"income"},
  {id:"s364",date:"2026-02-12",desc:'CNB',amount:5368.53,cat:'Income',type:"income"},
  {id:"s365",date:"2026-02-12",desc:'CNB',amount:19.58,cat:'Income',type:"income"},
  {id:"s366",date:"2026-02-26",desc:'CNB',amount:5368.52,cat:'Income',type:"income"},
  {id:"s367",date:"2026-03-01",desc:'VA',amount:1033.84,cat:'Income',type:"income"},
  {id:"s368",date:"2026-03-03",desc:'ZOETIC STAGE, IN',amount:1000.0,cat:'Income',type:"income"},
];

function genId() { return "t"+Date.now()+Math.random().toString(36).slice(2,7); }
function fmt(v) {
  const s = "$"+Math.round(Math.abs(v)).toLocaleString("en-US");
  return v<0?"-"+s:s;
}
function fmtK(v) {
  const a=Math.abs(v);
  return (v<0?"-":"")+(a>=1000?"$"+(a/1000).toFixed(1)+"k":"$"+Math.round(a));
}

function parseXlsxDate(v) {
  if (!v) return null;
  if (typeof v==="number") {
    try { const d=XLSX.SSF.parse_date_code(v); return d?`${d.y}-${String(d.m).padStart(2,"0")}-${String(d.d).padStart(2,"0")}`:null; } catch { return null; }
  }
  if (v instanceof Date) return v.toISOString().slice(0,10);
  const d=new Date(String(v));
  return isNaN(d)?null:d.toISOString().slice(0,10);
}

function normCat(raw) {
  if (!raw) return "Miscellaneous";
  const r=String(raw).trim();
  if (CATEGORIES.includes(r)) return r;
  for (const c of CATEGORIES) if (r.toLowerCase().includes(c.slice(0,5).toLowerCase())) return c;
  return "Miscellaneous";
}

function parseHernandezXlsx(file) {
  return new Promise((resolve,reject) => {
    const fr=new FileReader();
    fr.onload=e=>{
      try {
        const wb=XLSX.read(e.target.result,{type:"array",cellDates:true});
        const ws=wb.Sheets["Transactions"];
        if (!ws) { reject("Could not find 'Transactions' sheet."); return; }
        const raw=XLSX.utils.sheet_to_json(ws,{header:1,defval:""});
        const out=[];
        let start=1;
        for (let i=0;i<Math.min(raw.length,5);i++) {
          if (String(raw[i][0]).toLowerCase().includes("date")) { start=i+1; break; }
        }
        for (let i=start;i<raw.length;i++) {
          const r=raw[i];
          // Expenses: A=date, B=desc, C=amount, D=category
          const ed=parseXlsxDate(r[0]), ea=parseFloat(r[2]);
          const edesc=String(r[1]||"").trim();
          if (ed&&edesc&&!isNaN(ea)&&ea!==0) {
            out.push({id:genId(),date:ed,desc:edesc,amount:ea,cat:normCat(r[3]),type:"expense"});
          }
          // Income: G=date, H=desc, I=amount
          const id2=parseXlsxDate(r[6]), ia=parseFloat(r[8]);
          const idesc=String(r[7]||"").trim();
          if (id2&&idesc&&!isNaN(ia)&&ia>0&&!idesc.toLowerCase().includes("total")) {
            out.push({id:genId(),date:id2,desc:idesc,amount:ia,cat:"Income",type:"income"});
          }
        }
        resolve(out);
      } catch(err) { reject("Parse error: "+err.message); }
    };
    fr.onerror=()=>reject("Could not read file.");
    fr.readAsArrayBuffer(file);
  });
}

const IS={width:"100%",padding:"10px 13px",border:"1px solid #DDD5C8",borderRadius:10,fontSize:"0.88rem",fontFamily:"Georgia,serif",background:"#fff",color:"#2C2416",outline:"none",boxSizing:"border-box"};

export default function App() {
  const [txns,setTxns]=useState(null);
  const [tab,setTab]=useState("overview");
  const [month,setMonth]=useState(2);
  const [showAdd,setShowAdd]=useState(false);
  const [showImport,setShowImport]=useState(false);
  const [importStatus,setImportStatus]=useState(null);
  const [importing,setImporting]=useState(false);
  const [search,setSearch]=useState("");
  const [catF,setCatF]=useState("All");
  const [page,setPage]=useState(30);
  const [sortBy,setSortBy]=useState("date-desc"); // date-desc | date-asc | amt-desc | amt-asc
  const [saved,setSaved]=useState(false);
  const [loading,setLoading]=useState(true);
  const [form,setForm]=useState({date:new Date().toISOString().slice(0,10),desc:"",amount:"",cat:CATEGORIES[0],type:"expense"});
  const fileRef=useRef(null);

  useEffect(()=>{
    async function load(){
      try {
        console.log("Loading from Supabase...");
        const rows = await db.getAll();
        console.log("Supabase returned:", rows ? rows.length : 0, "rows");
        if(rows && rows.length>0){ setTxns(rows); }
        else { setTxns(SEED); }
      } catch(e) {
        console.error("Load error:", e);
        setTxns(SEED);
      }
      setLoading(false);
    }
    load();
  },[]);

  const persist=useCallback(async(t)=>{
    try {
      const mapped=t.map(r=>({id:r.id,date:r.date,description:r.desc,amount:r.amount,cat:r.cat,type:r.type}));
      await fetch(`${SUPABASE_URL}/rest/v1/transactions`,{
        method:"POST",
        headers:{apikey:SUPABASE_KEY,Authorization:`Bearer ${SUPABASE_KEY}`,"Content-Type":"application/json",Prefer:"resolution=merge-duplicates"},
        body:JSON.stringify(mapped)
      });
      setSaved(true); setTimeout(()=>setSaved(false),1800);
    } catch(e){console.error(e);}
  },[]);

  const addTxn=async()=>{
    if(!form.desc||!form.amount||isNaN(parseFloat(form.amount)))return;
    const t={...form,id:genId(),amount:parseFloat(form.amount)};
    const u=[t,...txns]; setTxns(u);
    try { await db.upsert([t]); setSaved(true); setTimeout(()=>setSaved(false),1800); } catch(e){console.error(e);}
    setShowAdd(false);
    setForm({date:new Date().toISOString().slice(0,10),desc:"",amount:"",cat:CATEGORIES[0],type:"expense"});
  };

  const delTxn=async(id)=>{
    const u=txns.filter(t=>t.id!==id); setTxns(u);
    try { await db.remove(id); setSaved(true); setTimeout(()=>setSaved(false),1800); } catch(e){console.error(e);}
  };

  const handleFile=async(e)=>{
    const f=e.target.files?.[0]; if(!f)return;
    setImporting(true); setImportStatus(null);
    try {
      const parsed=await parseHernandezXlsx(f);
      if(!parsed.length){ setImportStatus({error:"No transactions found. Check the file has a 'Transactions' sheet."}); setImporting(false); return; }
      const keys=new Set(txns.map(t=>`${t.date}|${t.desc}|${t.amount}`));
      const newOnes=parsed.filter(t=>!keys.has(`${t.date}|${t.desc}|${t.amount}`));
      const dupes=parsed.length-newOnes.length;
      const u=[...newOnes,...txns].sort((a,b)=>b.date.localeCompare(a.date));
      setTxns(u);
      if(newOnes.length>0){
        const mapped=newOnes.map(r=>({id:r.id,date:r.date,description:r.desc,amount:r.amount,cat:r.cat,type:r.type}));
        await fetch(`${SUPABASE_URL}/rest/v1/transactions`,{
          method:"POST",
          headers:{apikey:SUPABASE_KEY,Authorization:`Bearer ${SUPABASE_KEY}`,"Content-Type":"application/json",Prefer:"resolution=merge-duplicates"},
          body:JSON.stringify(mapped)
        });
      }
      setSaved(true); setTimeout(()=>setSaved(false),1800);
      setImportStatus({added:newOnes.length,dupes});
    } catch(err){ setImportStatus({error:typeof err==="string"?err:"Import failed. Check the file format."}); }
    setImporting(false); e.target.value="";
  };

  if(loading||!txns) return <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100vh",background:"#F8FAFC",fontFamily:"Georgia,serif",color:"#6B7280"}}>Loading your budget…</div>;

  const mTxns=txns.filter(t=>{const d=new Date(t.date+"T12:00:00");return d.getMonth()===month;});
  const income=mTxns.filter(t=>t.type==="income").reduce((s,t)=>s+t.amount,0);
  const expenses=mTxns.filter(t=>t.type==="expense"&&t.amount>0).reduce((s,t)=>s+t.amount,0);
  const refunds=Math.abs(mTxns.filter(t=>t.type==="expense"&&t.amount<0).reduce((s,t)=>s+t.amount,0));
  const netExp=expenses-refunds;
  const savings=income-netExp;

  const catTotals={};
  CATEGORIES.forEach(c=>catTotals[c]=0);
  mTxns.filter(t=>t.type==="expense").forEach(t=>{if(catTotals[t.cat]!==undefined)catTotals[t.cat]+=t.amount;});

  const trendData=MONTHS.slice(0,12).map((m,i)=>{
    const mt=txns.filter(t=>{const d=new Date(t.date+"T12:00:00");return d.getMonth()===i;});
    const inc=mt.filter(t=>t.type==="income").reduce((s,t)=>s+t.amount,0);
    const exp=mt.filter(t=>t.type==="expense"&&t.amount>0).reduce((s,t)=>s+t.amount,0);
    return{month:m.slice(0,3),income:inc||null,expenses:exp||null,budget:9000};
  }).filter(d=>d.income||d.expenses);

  const CAT_ABBREV={
    "Housing & Utilities":"Housing",
    "Food":"Food",
    "Shopping & Subscription":"Shopping",
    "Transportation":"Transport",
    "Personal Care":"Personal",
    "Entertainment":"Entertain.",
    "Education Expense":"Education",
    "Tithe, Charity, & Gifts":"Tithe/Gifts",
    "Housewares and furnishings":"Housewares",
    "Kid's":"Kid's",
    "Miscellaneous":"Misc.",
  };
  const donutData=CATEGORIES
    .filter(c=>catTotals[c]>0)
    .map(c=>({name:CAT_ABBREV[c]||c,fullName:c,value:catTotals[c],color:CAT_COLORS[c],budget:BUDGET[c]}))
    .sort((a,b)=>b.budget-a.budget);

  const fTxns=mTxns.filter(t=>{
    const q=search.toLowerCase();
    return(!q||t.desc.toLowerCase().includes(q)||t.cat.toLowerCase().includes(q))&&
      (catF==="All"||t.cat===catF||(catF==="Income"&&t.type==="income"));
  }).sort((a,b)=>{
    if(sortBy==="date-desc") return b.date.localeCompare(a.date);
    if(sortBy==="date-asc")  return a.date.localeCompare(b.date);
    if(sortBy==="amt-desc")  return Math.abs(b.amount)-Math.abs(a.amount);
    if(sortBy==="amt-asc")   return Math.abs(a.amount)-Math.abs(b.amount);
    return 0;
  });
  // Category sum for the active filter
  const catSum = catF==="All"||catF==="Income" ? null
    : fTxns.reduce((s,t)=>s+(t.amount>0?t.amount:0),0);

  const TABS=[{id:"overview",label:"Overview",Icon:TrendingUp},{id:"transactions",label:"Txns",Icon:List},{id:"networth",label:"Net Worth",Icon:BarChart2}];

  return(
  <div style={{fontFamily:"Georgia,serif",background:"#F8FAFC",minHeight:"100vh",color:"#111827"}}>

    {/* HEADER */}
    <div style={{background:"#1E1B4B",color:"#FAF7F2",position:"sticky",top:0,zIndex:100}}>
      <div style={{padding:"13px 16px 0",maxWidth:700,margin:"0 auto"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
          <div>
            <div style={{fontSize:"clamp(1rem,4vw,1.35rem)",fontWeight:"bold"}}>Hernandez Budget</div>
            <div style={{fontSize:"0.6rem",color:"#818CF8",letterSpacing:"0.1em",textTransform:"uppercase",marginTop:1}}>2026 · Family Tracker</div>
          </div>
          <div style={{display:"flex",gap:6,alignItems:"center"}}>
            {saved&&<div style={{display:"flex",alignItems:"center",gap:3,background:"#4A6741",padding:"3px 8px",borderRadius:20,fontSize:"0.62rem",color:"#fff"}}><CheckCircle size={10}/>Saved</div>}
            <button onClick={()=>{setShowImport(true);setImportStatus(null);}} style={{background:"#4F46E5",color:"#fff",border:"none",borderRadius:20,padding:"6px 11px",fontSize:"0.7rem",fontWeight:"bold",cursor:"pointer",display:"flex",alignItems:"center",gap:4}}>
              <Upload size={11}/>Import
            </button>
            <button onClick={()=>setShowAdd(true)} style={{background:"#10B981",color:"#fff",border:"none",borderRadius:20,padding:"6px 11px",fontSize:"0.7rem",fontWeight:"bold",cursor:"pointer",display:"flex",alignItems:"center",gap:4}}>
              <PlusCircle size={11}/>Add
            </button>
          </div>
        </div>
        <div style={{display:"flex",overflowX:"auto",scrollbarWidth:"none"}}>
          {TABS.map(({id,label,Icon})=>(
            <button key={id} onClick={()=>setTab(id)} style={{flexShrink:0,padding:"7px 12px",fontSize:"0.66rem",fontWeight:"600",letterSpacing:"0.06em",textTransform:"uppercase",background:"none",border:"none",cursor:"pointer",fontFamily:"Georgia,serif",color:tab===id?"#FAF7F2":"#7A6E60",borderBottom:tab===id?"2px solid #818CF8":"2px solid transparent",display:"flex",alignItems:"center",gap:3}}>
              <Icon size={10}/>{label}
            </button>
          ))}
        </div>
      </div>
    </div>

    {/* MONTH NAV */}
    {tab!=="networth"&&(
      <div style={{padding:"11px 16px 0",maxWidth:700,margin:"0 auto"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:12,background:"#fff",border:"1px solid #DDD5C8",borderRadius:12,padding:"8px 16px"}}>
          <button onClick={()=>month>0&&setMonth(m=>m-1)} style={{background:"#EEF2FF",border:"none",width:28,height:28,borderRadius:"50%",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",opacity:month===0?0.3:1}}><ChevronLeft size={14}/></button>
          <span style={{fontSize:"0.95rem",minWidth:130,textAlign:"center"}}>{MONTHS[month]} 2026</span>
          <button onClick={()=>month<11&&setMonth(m=>m+1)} style={{background:"#EEF2FF",border:"none",width:28,height:28,borderRadius:"50%",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",opacity:month===11?0.3:1}}><ChevronRight size={14}/></button>
        </div>
      </div>
    )}

    <div style={{padding:"13px 16px 100px",maxWidth:700,margin:"0 auto"}}>

      {/* OVERVIEW */}
      {tab==="overview"&&<>
        {/* Stat cards */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:9,marginBottom:13}}>
          {[{l:"Income",v:fmt(income),c:"#059669",bg:"#ECFDF5"},{l:"Expenses",v:fmt(netExp),c:"#DC2626",bg:"#FEF2F2"},{l:"Saved",v:fmt(savings),c:savings>=0?"#D97706":"#DC2626",bg:savings>=0?"#FFFBEB":"#FEF2F2"}].map(({l,v,c,bg})=>(
            <div key={l} style={{background:bg,border:`1px solid ${c}22`,borderRadius:14,padding:"13px 9px",textAlign:"center"}}>
              <div style={{fontSize:"0.58rem",textTransform:"uppercase",letterSpacing:"0.08em",color:"#6B7280",marginBottom:5}}>{l}</div>
              <div style={{fontSize:"clamp(0.9rem,3vw,1.25rem)",color:c,fontWeight:"bold"}}>{v}</div>
            </div>
          ))}
        </div>

        {/* Key Insights */}
        {(()=>{
          const insights=[];
          // Over budget categories
          CATEGORIES.forEach(cat=>{
            const a=catTotals[cat]||0,b=BUDGET[cat];
            if(a>b) insights.push({type:"over",emoji:"🔴",msg:`${CAT_EMOJI[cat]} ${cat} is $${Math.round(a-b)} over budget (${((a/b)*100).toFixed(0)}% of $${b} target)`});
          });
          // Close to limit
          CATEGORIES.forEach(cat=>{
            const a=catTotals[cat]||0,b=BUDGET[cat];
            if(a/b>0.85&&a<=b) insights.push({type:"warn",emoji:"🟡",msg:`${CAT_EMOJI[cat]} ${cat} is at ${((a/b)*100).toFixed(0)}% — only $${Math.round(b-a)} remaining`});
          });
          // Top spender
          const topCat=CATEGORIES.reduce((best,c)=>catTotals[c]>catTotals[best]?c:best,CATEGORIES[0]);
          if(catTotals[topCat]>0) insights.push({type:"info",emoji:"📊",msg:`${CAT_EMOJI[topCat]} ${topCat} is your biggest expense at ${fmt(catTotals[topCat])}`});
          // Savings rate
          if(income>0){
            const rate=((income-netExp)/income*100);
            if(rate>0) insights.push({type:"good",emoji:"💚",msg:`Saving ${rate.toFixed(0)}% of income this month — great work!`});
            else insights.push({type:"over",emoji:"🔴",msg:`Spending exceeds income by ${fmt(Math.abs(income-netExp))} this month`});
          }
          if(insights.length===0) return null;
          return(
            <div style={{background:"#1E1B4B",borderRadius:14,padding:"14px 16px",marginBottom:13}}>
              <div style={{fontSize:"0.6rem",textTransform:"uppercase",letterSpacing:"0.1em",color:"#818CF8",marginBottom:10}}>🔍 Key Insights — {MONTHS[month]}</div>
              <div style={{display:"flex",flexDirection:"column",gap:7}}>
                {insights.slice(0,4).map((ins,i)=>(
                  <div key={i} style={{display:"flex",alignItems:"flex-start",gap:8,fontSize:"0.78rem",color:"#E0E7FF",lineHeight:1.4}}>
                    <span style={{flexShrink:0}}>{ins.emoji}</span>
                    <span>{ins.msg}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}

        {/* Budget total callout */}
        <div style={{background:"#1E1B4B",borderRadius:14,padding:"12px 16px",marginBottom:13,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div>
            <div style={{fontSize:"0.6rem",textTransform:"uppercase",letterSpacing:"0.1em",color:"#A5B4FC",marginBottom:3}}>Monthly Budget</div>
            <div style={{fontSize:"1.5rem",fontWeight:"bold",color:"#fff"}}>$9,000</div>
          </div>
          <div style={{textAlign:"right"}}>
            <div style={{fontSize:"0.6rem",textTransform:"uppercase",letterSpacing:"0.1em",color:"#A5B4FC",marginBottom:3}}>Spent</div>
            <div style={{fontSize:"1.5rem",fontWeight:"bold",color:netExp>9000?"#F87171":"#34D399"}}>{fmt(netExp)}</div>
          </div>
          <div style={{textAlign:"right"}}>
            <div style={{fontSize:"0.6rem",textTransform:"uppercase",letterSpacing:"0.1em",color:"#A5B4FC",marginBottom:3}}>{netExp>9000?"Over":"Left"}</div>
            <div style={{fontSize:"1.5rem",fontWeight:"bold",color:netExp>9000?"#F87171":"#34D399"}}>{fmt(Math.abs(9000-netExp))}</div>
          </div>
        </div>

        {/* Budget vs Actual */}
        <div style={{background:"#fff",border:"1px solid #E5E7EB",borderRadius:14,padding:16,marginBottom:13}}>
          <div style={{fontSize:"0.6rem",textTransform:"uppercase",letterSpacing:"0.08em",color:"#9CA3AF",marginBottom:14}}>Budget vs. Actual — {MONTHS[month]}</div>
          {CATEGORIES.map(cat=>{
            const a=catTotals[cat]||0,b=BUDGET[cat];
            const pct=Math.min((a/b)*100,100);
            const over=a>b,warn=a/b>0.85&&!over;
            const barColor=over?"#DC2626":warn?"#D97706":"#059669";
            const remaining=b-a;
            const emoji=CAT_EMOJI[cat]||"•";
            return(<div key={cat} style={{marginBottom:14}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:5,alignItems:"center"}}>
                <span style={{fontSize:"0.88rem",fontWeight:600,display:"flex",alignItems:"center",gap:7}}>
                  <span style={{fontSize:"1.1rem"}}>{emoji}</span>{cat}
                </span>
                <span style={{fontSize:"0.75rem",display:"flex",gap:8,alignItems:"center"}}>
                  <span style={{color:barColor,fontWeight:700}}>{fmt(a)}</span>
                  <span style={{color:"#D1D5DB"}}>/</span>
                  <span style={{color:"#6B7280"}}>{fmt(b)}</span>
                  <span style={{color:remaining>=0?"#059669":"#DC2626",fontWeight:600,fontSize:"0.7rem"}}>
                    {remaining>=0?`${fmt(remaining)} left`:`${fmt(Math.abs(remaining))} over`}
                  </span>
                  <span style={{color:barColor,fontWeight:600,fontSize:"0.7rem"}}>{pct.toFixed(0)}%</span>
                </span>
              </div>
              <div style={{height:14,background:"#F3F4F6",borderRadius:7,overflow:"hidden"}}>
                <div style={{height:"100%",width:`${pct}%`,background:barColor,borderRadius:7,transition:"width 0.7s ease"}}/>
              </div>
            </div>);
          })}
        </div>

        <div style={{background:"#fff",border:"1px solid #DDD5C8",borderRadius:12,padding:14}}>
          <div style={{fontSize:"0.6rem",textTransform:"uppercase",letterSpacing:"0.08em",color:"#7A6E60",marginBottom:11}}>Income vs. Expenses — 2026</div>
          <ResponsiveContainer width="100%" height={185}>
            <BarChart data={trendData} margin={{top:5,right:5,bottom:0,left:0}} barCategoryGap="28%">
              <XAxis dataKey="month" tick={{fontSize:9}} axisLine={false} tickLine={false}/>
              <YAxis tick={{fontSize:9}} axisLine={false} tickLine={false} tickFormatter={fmtK} width={38}/>
              <Tooltip formatter={(v,n)=>[fmt(v),n]} contentStyle={{fontSize:10,borderRadius:8,border:"1px solid #DDD5C8"}} cursor={{fill:"rgba(0,0,0,0.03)"}}/>
              <Bar dataKey="income" name="Income" fill="#059669" radius={[3,3,0,0]}/>
              <Bar dataKey="expenses" name="Expenses" fill="#DC2626" radius={[3,3,0,0]}/>
            </BarChart>
          </ResponsiveContainer>

          <div style={{display:"flex",gap:12,justifyContent:"center",marginTop:6,marginBottom:14}}>
            {[["Income","#059669"],["Expenses","#DC2626"]].map(([l,c])=>(
              <div key={l} style={{display:"flex",alignItems:"center",gap:4,fontSize:"0.66rem",color:"#7A6E60"}}>
                <div style={{width:8,height:8,borderRadius:2,background:c}}/>{l}
              </div>
            ))}
          </div>

          <div style={{borderTop:"1px solid #E5E7EB",paddingTop:13}}>
            <div style={{fontSize:"0.6rem",textTransform:"uppercase",letterSpacing:"0.08em",color:"#9CA3AF",marginBottom:10}}>Net Cash Flow</div>
            {(()=>{
              const maxAbs=Math.max(...trendData.map(d=>Math.abs((d.income||0)-(d.expenses||0))),1);
              return trendData.map(d=>{
                const net=(d.income||0)-(d.expenses||0);
                const isPos=net>=0;
                const barPct=Math.min((Math.abs(net)/maxAbs)*45,45);
                return(
                  <div key={d.month} style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
                    <div style={{width:24,fontSize:"0.63rem",color:"#7A6E60",flexShrink:0,textAlign:"right"}}>{d.month}</div>
                    <div style={{flex:1,height:20,position:"relative",background:"#F3F4F6",borderRadius:4,overflow:"hidden"}}>
                      <div style={{position:"absolute",left:"50%",top:0,bottom:0,width:1,background:"#D1D5DB",zIndex:1}}/>
                      <div style={{
                        position:"absolute",height:"100%",
                        width:barPct+"%",
                        background:isPos?"#059669":"#DC2626",
                        borderRadius:isPos?"0 3px 3px 0":"3px 0 0 3px",
                        left:isPos?"50%":"auto",
                        right:isPos?"auto":"50%",
                        opacity:0.82,
                      }}/>
                      <div style={{
                        position:"absolute",
                        fontSize:"0.61rem",fontWeight:"bold",
                        color:isPos?"#065F46":"#991B1B",
                        left:isPos?"calc(50% + 5px)":"auto",
                        right:isPos?"auto":"calc(50% + 5px)",
                        top:"50%",transform:"translateY(-50%)",
                        whiteSpace:"nowrap",zIndex:2,
                      }}>
                        {isPos?"+":""}{fmtK(net)}
                      </div>
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        </div>
      </>}

      {/* TRANSACTIONS */}
      {tab==="transactions"&&<>
        <div style={{position:"relative",marginBottom:8}}>
          <Search size={13} style={{position:"absolute",left:11,top:"50%",transform:"translateY(-50%)",color:"#A09080"}}/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search…" style={{...IS,paddingLeft:32}}/>
        </div>

        {/* Sort controls */}
        <div style={{display:"flex",gap:5,marginBottom:8,justifyContent:"flex-end"}}>
          <span style={{fontSize:"0.62rem",color:"#A09080",alignSelf:"center"}}>Sort:</span>
          {[["date-desc","Newest"],["date-asc","Oldest"],["amt-desc","$ High"],["amt-asc","$ Low"]].map(([val,label])=>(
            <button key={val} onClick={()=>setSortBy(val)} style={{padding:"3px 9px",borderRadius:20,fontSize:"0.62rem",fontWeight:600,border:"1px solid",cursor:"pointer",fontFamily:"Georgia,serif",borderColor:sortBy===val?"#2C2416":"#DDD5C8",background:sortBy===val?"#2C2416":"#fff",color:sortBy===val?"#FAF7F2":"#7A6E60"}}>
              {label}
            </button>
          ))}
        </div>

        {/* Category filter chips */}
        <div style={{display:"flex",gap:5,overflowX:"auto",scrollbarWidth:"none",marginBottom:8,paddingBottom:2}}>
          {["All","Income",...CATEGORIES].map(c=>(
            <button key={c} onClick={()=>{setCatF(c);setPage(30);}} style={{flexShrink:0,padding:"4px 10px",borderRadius:20,fontSize:"0.64rem",fontWeight:600,border:"1px solid",cursor:"pointer",fontFamily:"Georgia,serif",borderColor:catF===c?"#1E1B4B":"#DDD5C8",background:catF===c?"#1E1B4B":"#fff",color:catF===c?"#FAF7F2":"#6B7280"}}>
              {CAT_EMOJI[c]?`${CAT_EMOJI[c]} ${c.length>10?c.slice(0,9)+"…":c}`:c}
            </button>
          ))}
        </div>

        {/* Category sum */}
        {catSum!==null&&(
          <div style={{background:"#F0EAE0",borderRadius:10,padding:"8px 13px",marginBottom:8,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <span style={{fontSize:"0.72rem",color:"#5A4E40",fontWeight:500}}>{catF} — {MONTHS[month]}</span>
            <span style={{fontSize:"0.9rem",fontWeight:"bold",color:"#2C2416",fontFamily:"Georgia,serif"}}>{fmt(catSum)}</span>
          </div>
        )}

        <div style={{display:"flex",flexDirection:"column",gap:5}}>
          {fTxns.slice(0,page).map(t=>{
            const d=new Date(t.date+"T12:00:00"),ds=d.toLocaleDateString("en-US",{month:"short",day:"numeric"});
            const isInc=t.type==="income",isRef=t.type==="expense"&&t.amount<0;
            const ac=isInc||isRef?"#4A6741":"#C0522A",pre=isInc||isRef?"+":"−";
            return(
              <div key={t.id} style={{background:"#fff",border:"1px solid #DDD5C8",borderRadius:10,padding:"9px 12px",display:"flex",alignItems:"center",gap:8}}>
                <div style={{width:7,height:7,borderRadius:"50%",flexShrink:0,background:isInc?"#4A6741":CAT_COLORS[t.cat]||"#A09080"}}/>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:"0.78rem",fontWeight:"bold",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{t.desc}</div>
                  <div style={{fontSize:"0.62rem",color:"#7A6E60",marginTop:1}}>{ds} · {isInc?"Income":t.cat}</div>
                </div>
                <div style={{display:"flex",alignItems:"center",gap:6}}>
                  <div style={{fontSize:"0.85rem",color:ac,fontWeight:"bold",whiteSpace:"nowrap"}}>{pre}{fmt(t.amount)}</div>
                  <button onClick={()=>delTxn(t.id)} style={{background:"none",border:"none",cursor:"pointer",padding:2,color:"#CCC",display:"flex"}}><Trash2 size={11}/></button>
                </div>
              </div>
            );
          })}
        </div>
        {fTxns.length>page&&<button onClick={()=>setPage(p=>p+20)} style={{width:"100%",marginTop:8,padding:10,border:"1px dashed #DDD5C8",borderRadius:10,background:"none",cursor:"pointer",fontSize:"0.73rem",color:"#7A6E60",fontFamily:"Georgia,serif"}}>Show {Math.min(20,fTxns.length-page)} more ({fTxns.length-page} remaining)</button>}
        {fTxns.length===0&&<div style={{textAlign:"center",padding:36,color:"#A09080",fontSize:"0.86rem"}}>No transactions found</div>}
      </>}

      {/* NET WORTH */}
      {tab==="networth"&&<>

        {/* Hero */}
        <div style={{background:"#1E1B4B",color:"#FAF7F2",borderRadius:16,padding:"20px 18px",marginBottom:13,textAlign:"center"}}>
          <div style={{fontSize:"0.6rem",textTransform:"uppercase",letterSpacing:"0.1em",color:"#818CF8",marginBottom:5}}>Total Net Worth</div>
          <div style={{fontSize:"clamp(1.8rem,7vw,2.6rem)",fontWeight:"bold"}}>$836,050</div>
          <div style={{fontSize:"0.65rem",color:"#818CF8",marginTop:4}}>As of March 2026 · Total Assets $1,153,332</div>
        </div>

        {/* Summary cards */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:9,marginBottom:13}}>
          <div style={{background:"#ECFDF5",border:"1px solid #6EE7B7",borderRadius:14,padding:"13px 12px"}}>
            <div style={{fontSize:"0.58rem",textTransform:"uppercase",letterSpacing:"0.08em",color:"#059669",marginBottom:5}}>Total Assets</div>
            <div style={{fontSize:"1.15rem",color:"#065F46",fontWeight:"bold"}}>$1,153,332</div>
            <div style={{fontSize:"0.62rem",color:"#6B7280",marginTop:2}}>Cash + Investments + RE</div>
          </div>
          <div style={{background:"#FEF2F2",border:"1px solid #FCA5A5",borderRadius:14,padding:"13px 12px"}}>
            <div style={{fontSize:"0.58rem",textTransform:"uppercase",letterSpacing:"0.08em",color:"#DC2626",marginBottom:5}}>Total Debt</div>
            <div style={{fontSize:"1.15rem",color:"#991B1B",fontWeight:"bold"}}>$317,282</div>
            <div style={{fontSize:"0.62rem",color:"#6B7280",marginTop:2}}>Mortgages + Credit</div>
          </div>
        </div>

        {/* What You Own vs What You Owe */}
        <div style={{background:"#fff",border:"1px solid #E5E7EB",borderRadius:14,padding:16,marginBottom:13}}>
          <div style={{fontSize:"0.6rem",textTransform:"uppercase",letterSpacing:"0.08em",color:"#9CA3AF",marginBottom:14}}>What You Own vs. What You Owe</div>
          {(()=>{
            const total=1153332;
            const segments=[
              {label:"Cash",value:50832,color:"#0891B2"},
              {label:"Investments",value:217499,color:"#4F46E5"},
              {label:"Real Estate",value:885001,color:"#D97706"},
            ];
            const liabilities=317282;
            const liabPct=(liabilities/total)*100;
            return(<>
              <div style={{height:56,borderRadius:10,overflow:"hidden",display:"flex",marginBottom:8}}>
                {segments.map(s=>(
                  <div key={s.label} style={{width:`${(s.value/total)*100}%`,background:s.color,height:"100%",display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden"}}>
                    {(s.value/total)>0.07&&<span style={{fontSize:"0.65rem",fontWeight:"bold",color:"#fff",whiteSpace:"nowrap",padding:"0 6px"}}>{s.label}</span>}
                  </div>
                ))}
              </div>
              <div style={{height:56,borderRadius:10,background:"#F3F4F6",marginBottom:14,position:"relative",overflow:"hidden"}}>
                <div style={{position:"absolute",right:0,top:0,bottom:0,width:`${liabPct}%`,background:"#DC2626",borderRadius:"10px 0 0 10px",display:"flex",alignItems:"center",justifyContent:"center"}}>
                  <span style={{fontSize:"0.65rem",fontWeight:"bold",color:"#fff",whiteSpace:"nowrap",padding:"0 8px"}}>Debt {liabPct.toFixed(0)}%</span>
                </div>
                <div style={{position:"absolute",left:0,top:0,bottom:0,width:`${100-liabPct}%`,display:"flex",alignItems:"center",paddingLeft:10}}>
                  <span style={{fontSize:"0.65rem",fontWeight:"bold",color:"#059669",whiteSpace:"nowrap"}}>Net Worth {(100-liabPct).toFixed(0)}%</span>
                </div>
              </div>
              <div style={{display:"flex",flexWrap:"wrap",gap:10,justifyContent:"center"}}>
                {[...segments,{label:"Liabilities",value:liabilities,color:"#DC2626"}].map(s=>(
                  <div key={s.label} style={{display:"flex",alignItems:"center",gap:4,fontSize:"0.7rem",color:"#6B7280"}}>
                    <div style={{width:9,height:9,borderRadius:3,background:s.color,flexShrink:0}}/>
                    <span>{s.label}</span>
                    <span style={{fontWeight:"bold",color:"#111827"}}>${Math.round(s.value/1000)}k</span>
                  </div>
                ))}
              </div>
            </>);
          })()}
        </div>

        {/* True proportional treemap — 2 column layout for squarish tiles */}
        <div style={{background:"#fff",border:"1px solid #E5E7EB",borderRadius:14,padding:16,marginBottom:13}}>
          <div style={{fontSize:"0.6rem",textTransform:"uppercase",letterSpacing:"0.08em",color:"#9CA3AF",marginBottom:14}}>Assets by Category</div>
          {(()=>{
            const total=1153330;
            // Left column: Real Estate (76.7% of total) — tall
            const reTotal=885000;
            const rightTotal=total-reTotal; // investments + cash = 267500
            const invTotal=217500;
            const cashTotal=50840;
            const H=420; // total height
            const invH=Math.round((invTotal/rightTotal)*H);
            const cashH=H-invH;
            return(
              <div style={{display:"flex",gap:3,height:H,borderRadius:10,overflow:"hidden"}}>
                {/* LEFT: Real Estate — 3 stacked tiles proportional to value */}
                <div style={{flex:reTotal,display:"flex",flexDirection:"column",gap:3}}>
                  {[
                    {label:"SW 79th",sub:"Primary Home",value:425000,color:"#92400E"},
                    {label:"R5",sub:"Rental",value:235000,color:"#D97706"},
                    {label:"F314",sub:"Rental",value:225000,color:"#B45309"},
                  ].map(item=>(
                    <div key={item.label} style={{flex:item.value,background:item.color,padding:"10px 12px",display:"flex",flexDirection:"column",justifyContent:"space-between",minHeight:0}}>
                      <div style={{fontSize:"0.58rem",fontWeight:"600",color:"rgba(255,255,255,0.65)",letterSpacing:"0.05em"}}>{item.sub}</div>
                      <div>
                        <div style={{fontSize:"0.85rem",fontWeight:"bold",color:"#fff"}}>{item.label}</div>
                        <div style={{fontSize:"0.72rem",color:"rgba(255,255,255,0.85)"}}>${Math.round(item.value/1000)}k</div>
                      </div>
                    </div>
                  ))}
                </div>
                {/* RIGHT: Investments + Cash stacked */}
                <div style={{flex:rightTotal,display:"flex",flexDirection:"column",gap:3}}>
                  {/* Investments — broken into 3 tiles */}
                  <div style={{flex:invTotal,display:"flex",flexDirection:"column",gap:3}}>
                    {[
                      {label:"Retirement",sub:"401k / IRA",value:182840,color:"#1D4ED8"},
                      {label:"529 + HSA",sub:"Educ. & Health",value:25670,color:"#2563EB"},
                      {label:"Taxable",sub:"Brokerage",value:8990,color:"#3B82F6"},
                    ].map(item=>(
                      <div key={item.label} style={{flex:item.value,background:item.color,padding:"8px 10px",display:"flex",flexDirection:"column",justifyContent:"space-between",minHeight:0,overflow:"hidden"}}>
                        <div style={{fontSize:"0.56rem",fontWeight:"600",color:"rgba(255,255,255,0.65)",letterSpacing:"0.04em",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{item.sub}</div>
                        <div>
                          <div style={{fontSize:"0.78rem",fontWeight:"bold",color:"#fff",whiteSpace:"nowrap"}}>{item.label}</div>
                          <div style={{fontSize:"0.68rem",color:"rgba(255,255,255,0.85)"}}>${Math.round(item.value/1000)}k</div>
                        </div>
                      </div>
                    ))}
                  </div>
                  {/* Cash tile */}
                  <div style={{flex:cashTotal,background:"#059669",padding:"10px 12px",display:"flex",flexDirection:"column",justifyContent:"space-between",minHeight:0}}>
                    <div style={{fontSize:"0.58rem",fontWeight:"600",color:"rgba(255,255,255,0.65)",letterSpacing:"0.05em"}}>💵 Checking + EF</div>
                    <div>
                      <div style={{fontSize:"0.85rem",fontWeight:"bold",color:"#fff"}}>Cash</div>
                      <div style={{fontSize:"0.72rem",color:"rgba(255,255,255,0.85)"}}>$51k</div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>

        {/* Detail tables — rounded to nearest $10 */}
        {[
          ["💵 Cash & Checking",[["Checking #3344","$5,340"],["Emergency Fund","$45,250"],["Properties #9501","$240"],["UCU Savings","$10"],["Total Cash","$50,840",true]]],
          ["📈 Retirement",[["Fidelity 401k","$114,490"],["Roth IRA","$33,570"],["Traditional IRA","$23,240"],["Tasha Traditional","$11,540"],["Total Retirement","$182,840",true]]],
          ["🎓 529 + HSA",[["Ameriflex HSA","$8,880"],["Vanguard 529 (×2)","$16,790"],["Total 529 + HSA","$25,670",true]]],
          ["📊 Taxable Brokerage",[["Robinhood","$4,410"],["Tasha Roth","$4,580"],["Total Taxable","$8,990",true]]],
          ["🏘️ Real Estate",[["20721 SW 79th (Primary)","$425,000"],["7730 Camino Real F314","$225,000"],["9459 SW 76th St. R5","$235,000"],["Total RE","$885,000",true]]],
          ["🏦 Liabilities",[["Mortgage SW 79th","$172,700",false,true],["Mortgage R5","$98,230",false,true],["Mortgage F314","$34,070",false,true],["Navy Federal","$2,940",false,true],["Amazon Visa","$4,440",false,true],["Total Liabilities","$317,280",true,true]]],
        ].map(([sec,rows])=>(
          <div key={sec} style={{background:"#fff",border:"1px solid #E5E7EB",borderRadius:14,padding:"12px 14px",marginBottom:9}}>
            <div style={{fontSize:"0.72rem",fontWeight:"bold",color:"#1F2937",marginBottom:10}}>{sec}</div>
            {rows.map(([label,value,bold,red])=>(
              <div key={label} style={{display:"flex",justifyContent:"space-between",padding:"7px 0",borderBottom:"1px solid #F3F4F6",fontSize:"0.82rem"}}>
                <span style={{color:bold?"#111827":"#6B7280",fontWeight:bold?"700":"normal"}}>{label}</span>
                <span style={{fontWeight:bold?"700":"600",color:red?"#DC2626":"#111827"}}>{value}</span>
              </div>
            ))}
          </div>
        ))}
            </>}

    </div>

    {/* IMPORT MODAL */}
    {showImport&&(
      <div style={{position:"fixed",inset:0,background:"rgba(44,36,22,0.65)",zIndex:200,display:"flex",alignItems:"flex-end",justifyContent:"center"}} onClick={e=>e.target===e.currentTarget&&setShowImport(false)}>
        <div style={{background:"#FAF7F2",borderRadius:"20px 20px 0 0",padding:22,width:"100%",maxWidth:700}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
            <div style={{fontSize:"1.05rem",fontWeight:"bold"}}>Import from Excel</div>
            <button onClick={()=>setShowImport(false)} style={{background:"none",border:"none",cursor:"pointer",color:"#7A6E60"}}><X size={19}/></button>
          </div>
          <div style={{background:"#F0EAE0",borderRadius:11,padding:13,marginBottom:14,fontSize:"0.78rem",lineHeight:1.6,color:"#5A4E40"}}>
            <strong>Use your existing spreadsheet — no changes needed.</strong><br/>
            Upload <code style={{background:"#E8DFD0",padding:"1px 4px",borderRadius:3}}>Hernandez_Budget_2026.xlsx</code> and the app reads the <strong>Transactions</strong> sheet automatically. Expenses (cols A–D) and Income (cols G–I) are both imported. Duplicates are skipped.
          </div>
          <input ref={fileRef} type="file" accept=".xlsx,.xls" onChange={handleFile} style={{display:"none"}}/>
          <button onClick={()=>fileRef.current?.click()} disabled={importing}
            style={{width:"100%",padding:15,border:"2px dashed #C9993A",borderRadius:13,background:importing?"#F5F0E8":"#fff",cursor:importing?"default":"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:7,marginBottom:12}}>
            <FileSpreadsheet size={26} color="#C9993A"/>
            <span style={{fontSize:"0.83rem",color:"#5A4E40",fontWeight:"bold",fontFamily:"Georgia,serif"}}>{importing?"Importing…":"Tap to choose your Excel file"}</span>
            <span style={{fontSize:"0.68rem",color:"#A09080"}}>Supports .xlsx and .xls</span>
          </button>
          {importStatus&&!importStatus.error&&(
            <div style={{background:"#EFF6ED",border:"1px solid #B8D4B4",borderRadius:11,padding:13,display:"flex",alignItems:"center",gap:9}}>
              <CheckCircle size={19} color="#4A6741"/>
              <div style={{fontSize:"0.8rem",color:"#3A5430"}}>
                <strong>{importStatus.added} transactions imported.</strong>
                {importStatus.dupes>0&&<span style={{color:"#7A6E60"}}> {importStatus.dupes} duplicates skipped.</span>}
              </div>
            </div>
          )}
          {importStatus?.error&&(
            <div style={{background:"#FBEEE8",border:"1px solid #E8B4A0",borderRadius:11,padding:13,fontSize:"0.8rem",color:"#8A3A20"}}>
              ⚠️ {importStatus.error}
            </div>
          )}
        </div>
      </div>
    )}

    {/* ADD MODAL */}
    {showAdd&&(
      <div style={{position:"fixed",inset:0,background:"rgba(44,36,22,0.65)",zIndex:200,display:"flex",alignItems:"flex-end",justifyContent:"center"}} onClick={e=>e.target===e.currentTarget&&setShowAdd(false)}>
        <div style={{background:"#FAF7F2",borderRadius:"20px 20px 0 0",padding:22,width:"100%",maxWidth:700,maxHeight:"88vh",overflowY:"auto"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
            <div style={{fontSize:"1.05rem",fontWeight:"bold"}}>Add Transaction</div>
            <button onClick={()=>setShowAdd(false)} style={{background:"none",border:"none",cursor:"pointer",color:"#7A6E60"}}><X size={19}/></button>
          </div>
          <div style={{display:"flex",gap:8,marginBottom:13}}>
            {["expense","income"].map(tp=>(
              <button key={tp} onClick={()=>setForm(f=>({...f,type:tp}))} style={{flex:1,padding:"9px",borderRadius:10,border:"2px solid",cursor:"pointer",fontFamily:"Georgia,serif",fontSize:"0.82rem",fontWeight:"bold",borderColor:form.type===tp?(tp==="income"?"#4A6741":"#C0522A"):"#DDD5C8",background:form.type===tp?(tp==="income"?"#EFF6ED":"#FBEEE8"):"#fff",color:form.type===tp?(tp==="income"?"#4A6741":"#C0522A"):"#7A6E60"}}>
                {tp==="income"?"💰 Income":"💳 Expense"}
              </button>
            ))}
          </div>
          {[{l:"Date",el:<input type="date" value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))} style={IS}/>},
            {l:"Description",el:<input placeholder="e.g. Walmart Groceries" value={form.desc} onChange={e=>setForm(f=>({...f,desc:e.target.value}))} style={IS}/>},
            {l:"Amount ($)",el:<input type="number" placeholder="0.00" step="0.01" value={form.amount} onChange={e=>setForm(f=>({...f,amount:e.target.value}))} style={IS}/>},
            {l:"Category",el:<select value={form.cat} onChange={e=>setForm(f=>({...f,cat:e.target.value}))} style={IS}>{(form.type==="income"?INCOME_CATS:CATEGORIES).map(c=><option key={c}>{c}</option>)}</select>},
          ].map(({l,el})=>(
            <div key={l} style={{marginBottom:12}}>
              <div style={{fontSize:"0.66rem",textTransform:"uppercase",letterSpacing:"0.07em",color:"#7A6E60",marginBottom:4}}>{l}</div>
              {el}
            </div>
          ))}
          <button onClick={addTxn} style={{width:"100%",padding:"12px",background:"#2C2416",color:"#FAF7F2",border:"none",borderRadius:11,fontSize:"0.9rem",fontFamily:"Georgia,serif",fontWeight:"bold",cursor:"pointer",marginTop:2}}>
            Save Transaction
          </button>
        </div>
      </div>
    )}

  </div>
  );
}
