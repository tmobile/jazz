// export interface Record {
//   date: Date,
//   value: number
// }

// export interface GraphData {
//   xAxis: any,
//   yAxis: any,
//   data: any
// }

// const cost: GraphData = {
// 	xAxis: { label: 'TIME', range: 'day'},
// 	yAxis: { label: 'Cost'},
// 	data: {
//             "data": {
//                 "buckets": [
//                     {
//                         "key": "arn:aws:lambda:us-west-2:302890901340:function:platform_events-prod",
//                         "cost": 0.11632887006129522,
//                         "buckets": [
//                             {
//                                 "key": "2017-04-01 00:00:00",
//                                 "cost": 0.00035087000024702775
//                             },
//                             {
//                                 "key": "2017-05-01 00:00:00",
//                                 "cost": 0.016374559995909976
//                             },
//                             {
//                                 "key": "2017-06-01 00:00:00",
//                                 "cost": 0.06768811003611575
//                             },
//                             {
//                                 "key": "2017-07-01 00:00:00",
//                                 "cost": 0.03191533002902247
//                             }
//                         ]
//                     },
//                     {
//                         "key": "arn:aws:lambda:us-west-2:302890901340:function:platform_events-dev",
//                         "cost": 0.0006413599955692462,
//                         "buckets": [
//                             {
//                                 "key": "2017-04-01 00:00:00",
//                                 "cost": 0.000333629999190066
//                             },
//                             {
//                                 "key": "2017-05-01 00:00:00",
//                                 "cost": 0.00003572999929701837
//                             },
//                             {
//                                 "key": "2017-06-01 00:00:00",
//                                 "cost": 0.00011661999880629992
//                             },
//                             {
//                                 "key": "2017-07-01 00:00:00",
//                                 "cost": 0.0001553799982758619
//                             }
//                         ]
//                     }
//                 ],
//                 "cost": 0.11697023005686447
//             }
//         }
//     }
//     const costdata:GraphData = cost; 
// export default costdata; 
export interface Frequency {
  letter: string,
  frequency: number
}

export const STATISTICS: Frequency[] = [
  {letter: "A", frequency: .08167},
  {letter: "B", frequency: .01492},
  {letter: "C", frequency: .02782},
  {letter: "D", frequency: .04253},
  {letter: "E", frequency: .12702},
  {letter: "F", frequency: .02288},
  {letter: "G", frequency: .02015},
  {letter: "H", frequency: .06094},
  {letter: "I", frequency: .06966},
  {letter: "J", frequency: .00153},
  {letter: "K", frequency: .00772},
  {letter: "L", frequency: .04025},
  {letter: "M", frequency: .02406},
  {letter: "N", frequency: .06749},
  {letter: "O", frequency: .07507},
  {letter: "P", frequency: .01929},
  {letter: "Q", frequency: .00095},
  {letter: "R", frequency: .05987},
  {letter: "S", frequency: .06327},
  {letter: "T", frequency: .09056},
  {letter: "U", frequency: .02758},
  {letter: "V", frequency: .00978},
  {letter: "W", frequency: .02360},
  {letter: "X", frequency: .00150},
  {letter: "Y", frequency: .01974},
  {letter: "Z", frequency: .00074}
];
