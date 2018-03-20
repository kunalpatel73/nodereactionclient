import React, { Component } from "react";
const ReactDataGrid = require("react-data-grid");
const {
  Toolbar,
  Filters: {
    NumericFilter,
    AutoCompleteFilter,
    MultiSelectFilter,
    SingleSelectFilter
  },
  Data: { Selectors }
} = require("react-data-grid-addons");

import TimeSelector from "../components/TimeSelector.jsx";
import DashboardCard from "../components/DashboardCard.jsx";
export default class DashboardContainer extends Component {
  constructor(props) {
    super(props);
    this.fetchData = this.fetchData.bind(this);
    this.state = {
      response_time: null,
      requests: null,
      throughput: null,
      rows: []
    };
    this._columns = [
      {
        key: "route",
        name: "Route",
        width: 120,
        filterable: true,
        filterRenderer: MultiSelectFilter,
        sortable: true
      },
      {
        key: "method",
        name: "Method",
        filterable: true,
        filterRenderer: MultiSelectFilter,
        sortable: true
      },
      {
        key: "total_requests",
        name: "Requests",
        filterable: true,
        filterRenderer: NumericFilter,
        sortable: true
      },
      {
        key: "avg_duration",
        name: "Average Time",
        filterable: true,
        filterRenderer: NumericFilter,
        sortable: true
      }
    ];
  }

  //data fetching
  fetchData(offset) {
    let datetime = new Date(Date.now() - offset)
      .toISOString()
      .slice(0, 23)
      .replace("T", " ");
    this.fetchStats(datetime);
    this.fetchRows(datetime);
  }

  fetchStats = date => {
    window
      .fetch(`http://localhost:3000/api/dashboard/stats/${date}`)
      .then(res => res.json())
      .then(json => {
        let data = json[0];
        this.setState({
          response_time: data.avg_duration,
          requests: data.total_requests,
          throughput: "tbd"
        });
      });
  };

  fetchRows = date => {
    window
      .fetch(`http://localhost:3000/api/dashboard/top/${date}`)
      .then(res => res.json())
      .then(json => {
        this.setState({
          rows: json
        });
      });
  };

  //Grid functions
  handleGridSort = (sortColumn, sortDirection) => {
    const comparer = (a, b) => {
      if (sortDirection === "ASC") {
        return a[sortColumn] > b[sortColumn] ? 1 : -1;
      } else if (sortDirection === "DESC") {
        return a[sortColumn] < b[sortColumn] ? 1 : -1;
      }
    };

    const rows =
      sortDirection === "NONE"
        ? this.state.originalRows.slice(0)
        : this.state.rows.sort(comparer);

    this.setState({ rows });
  };

  rowGetter = index => {
    return Selectors.getRows(this.state)[index];
  };

  rowsCount = () => {
    return Selectors.getRows(this.state).length;
  };

  handleFilterChange = filter => {
    let newFilters = Object.assign({}, this.state.filters);
    if (filter.filterTerm) {
      newFilters[filter.column.key] = filter;
    } else {
      delete newFilters[filter.column.key];
    }
    this.setState({ filters: newFilters });
  };

  getValidFilterValues = columnId => {
    let values = this.state.rows.map(r => r[columnId]);
    return values.filter((item, i, a) => {
      return i === a.indexOf(item);
    });
  };

  handleOnClearFilters = () => {
    this.setState({ filters: {} });
  };

  onRowClick = (rowIdx, row) => {
    console.log("click", row);
    this.props.history.push("route/17/hourofthewitch");
    let rows = this.state.rows.slice();
    rows[rowIdx] = Object.assign({}, row, { isSelected: !row.isSelected });
    this.setState({ rows });
  };

  render() {
    return (
      <div className="pageContainer">
        <div className="pageHeaderContainer">
          <h1 className="pageHeader">Application Name - Dashboard</h1>
          <div className="timeSelector">
            <TimeSelector cb={this.fetchData} />
          </div>
        </div>
        <div className="dashboardCards">
          <DashboardCard title="Total Requests" value={this.state.requests}/>
          <DashboardCard title="Average Response Time" value={this.state.response_time}/>
          <DashboardCard title="Average Throughput" value={this.state.throughput}/>
        </div>

        <div className="top5Grid">
          <div>
            <h2>Routes - Top 5</h2>
          </div>
          <div>
            <ReactDataGrid
              enableCellSelect={false}
              onGridSort={this.handleGridSort}
              columns={this._columns}
              rowGetter={this.rowGetter}
              rowsCount={this.rowsCount()}
              minHeight={300}
              toolbar={<Toolbar enableFilter={true} />}
              onAddFilter={this.handleFilterChange}
              getValidFilterValues={this.getValidFilterValues}
              onClearFilters={this.handleOnClearFilters}
              onRowClick={this.onRowClick}
            />
          </div>
        </div>
      </div>
    );
  }
}
