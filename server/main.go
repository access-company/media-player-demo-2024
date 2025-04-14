package main

import (
	"net/http"
	"strconv"
	"strings"
	"time"
	"math/rand"
	"math"
	"fmt"
)

func randInt(r int) int {
	t := time.Now().UnixNano()
	rand.Seed(t)
	return rand.Intn(r)
}

func main() {
	isThrottling:= false
	var n int
	fmt.Print("Enable throttling mode? 0(disable) or 1(enable): ")
	fmt.Scanf("%d", &n)
	if (n != 0) {
		isThrottling = true
		fmt.Println("Start Server with throttling mode")
	} else {
		fmt.Println("Start Server without throttling mode")
	}
	degree := 0.0
	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		if isThrottling && strings.HasPrefix(r.URL.Path, "/segments/video") && !strings.HasSuffix(r.URL.Path, "init.mp4") {
			parts := strings.Split(r.URL.Path, "/")
			if len(parts) > 2 {
				resolutionID, err := strconv.Atoi(parts[len(parts)-2])
				if (err != nil) {
					w.WriteHeader(http.StatusInternalServerError)
					return
				}
				radian := float64(degree) * math.Pi / 180
				sinValue := math.Abs(math.Sin(radian))
				sleep_time := time.Duration(((resolutionID + 1) * 2) * int(sinValue * 1000)) * time.Millisecond
				fmt.Println(r.URL.Path, ": Sleep for", sleep_time)
				time.Sleep(sleep_time)
				degree += 1
				if (degree >= 360) {
					degree = 0
				}
			}
		}

		http.ServeFile(w, r, "www"+r.URL.Path)
	})

	fmt.Println("Please access http://localhost:8080")
	http.ListenAndServe(":8080", nil)
}
